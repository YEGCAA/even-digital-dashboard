// Roda agendado no GitHub Actions (.github/workflows/facilita-bundle.yml).
// Busca funnels + deals (etapa de escopo + etapas de perda) + detalhe de CADA
// negocio no MESMO proxy n8n que o site usa (nao muda nada no n8n), e escreve
// um bundle pronto em data/facilita-bundle-<client>.json. O site
// (services/facilitaService.ts, fetchBundle) serve esse arquivo estatico
// direto — carga instantanea pra qualquer pessoa, sem repetir as ~200
// chamadas de detalhe a cada novo navegador/computador.
//
// Mesmo formato de URL que facilitaService.ts usa em producao (proxy n8n):
// <FACILITA_PROXY_URL>?client=X&resource=Y&...

const PROXY_URL = (process.env.FACILITA_PROXY_URL || '').trim().replace(/\/$/, '');
if (!PROXY_URL) {
  console.error('FACILITA_PROXY_URL nao definido (configure como secret do GitHub Actions).');
  process.exit(1);
}

// Um client = um funil + etapa de escopo (SDR) + etapa(s) de perda. Mantenha
// alinhado com CONFIGS em services/facilitaService.ts.
const CLIENTS = {
  ribeirosantos: { funnelId: 1, scopeStageId: 1, lostStageIds: [8] },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GET com retry/backoff em 429/5xx e no "HTTP 200 com corpo de erro" da
// Facilita — mesmo tratamento que services/facilitaService.ts (fetchJson).
async function fetchJson(url, attempt = 0) {
  const res = await fetch(url);
  if ((res.status === 429 || res.status >= 500) && attempt < 7) {
    const retryAfter = Number(res.headers.get('retry-after'));
    const wait = retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * 2 ** attempt, 10000);
    await sleep(wait);
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  const json = await res.json();
  if (json && json.status === 'error') {
    if (attempt < 7) {
      await sleep(Math.min(1000 * 2 ** attempt, 10000));
      return fetchJson(url, attempt + 1);
    }
    throw new Error(`Facilita respondeu erro: ${json.message || 'sem detalhe'}`);
  }
  return json;
}

function buildUrl(client, resource, params = {}) {
  const q = new URLSearchParams({ client, resource, ...params });
  return `${PROXY_URL}?${q.toString()}`;
}

async function fetchAllDeals(client, funnelId, stageId) {
  const all = [];
  const seen = new Set();
  for (let page = 1; page <= 50; page++) {
    const json = await fetchJson(
      buildUrl(client, 'deals', {
        funnel_id: String(funnelId),
        funnel_stage_id: String(stageId),
        page: String(page),
        per_page: '100',
        sort: '-created_at',
      }),
    );
    const deals = json.data || [];
    deals.forEach((d) => {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        all.push(d);
      }
    });
    const lastPage = Number(json.last_page || 1);
    if (page >= lastPage) break;
  }
  return all;
}

// Detalhe de cada negocio: 3 em paralelo, 2s de gap — mesmo ritmo do site
// (~90 req/min), pra nao estourar o limite da Facilita (50-150/min).
const DETAIL_CONCURRENCY = 3;
const DETAIL_GAP_MS = 2000;

async function fetchDetails(client, deals) {
  const details = {};
  let i = 0;
  async function worker() {
    while (i < deals.length) {
      const idx = i++;
      const d = deals[idx];
      try {
        const json = await fetchJson(buildUrl(client, 'deal', { deal_id: String(d.id) }));
        const full = json.data || json;
        // So o grupo "Trafego" (score/campanha/respostas) e o historical
        // (mudancas de etapa/status) sao lidos (extractTrafego/extractHistory em
        // services/facilitaService.ts), e dentro deles so slug/name/value (campo)
        // e message/created_at (historico) — o resto (outros grupos do
        // formulario, documentos, perfil completo de quem mudou o negocio...) e'
        // descartado. Sem esse corte o bundle de ~200 negocios passava de 16MB
        // (os outros 4 grupos do formulario sozinhos: ~60KB por negocio; cada
        // linha de historico carrega o USUARIO INTEIRO que mudou o negocio).
        const trafego = (full.groups || [])
          .filter((g) => /tr[aá]fego/i.test(g.name || ''))
          .map((g) => ({
            name: g.name,
            fields: (g.fields || []).map((f) => ({
              slug: f.slug,
              name: f.name,
              value: f.value && typeof f.value === 'object' ? f.value.value : f.value,
            })),
          }));
        const historical = (full.historical || []).map((h) => ({ message: h.message, created_at: h.created_at }));
        details[d.id] = { groups: trafego, historical };
      } catch (err) {
        console.warn(`[${client}] falha no detalhe do negocio ${d.id}: ${err.message}`);
      }
      if (i < deals.length) await sleep(DETAIL_GAP_MS);
    }
  }
  await Promise.all(Array.from({ length: Math.min(DETAIL_CONCURRENCY, deals.length) }, worker));
  return details;
}

async function collect(client, cfg) {
  const funnelsJson = await fetchJson(buildUrl(client, 'funnels', { per_page: '100' }));
  const funnels = funnelsJson.data || [];

  const scopeDeals = await fetchAllDeals(client, cfg.funnelId, cfg.scopeStageId);
  const lostDealsLists = [];
  for (const stageId of cfg.lostStageIds) {
    lostDealsLists.push(await fetchAllDeals(client, cfg.funnelId, stageId));
  }
  const seen = new Set();
  const deals = [...scopeDeals, ...lostDealsLists.flat()].filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  console.log(`[${client}] ${deals.length} negocios (${scopeDeals.length} escopo + ${lostDealsLists.flat().length} perdidos) — buscando detalhe...`);
  const details = await fetchDetails(client, deals);

  return { cachedAt: new Date().toISOString(), funnels, deals, details };
}

async function main() {
  const fs = await import('node:fs/promises');
  await fs.mkdir('data', { recursive: true });
  for (const [client, cfg] of Object.entries(CLIENTS)) {
    const t0 = Date.now();
    const bundle = await collect(client, cfg);
    await fs.writeFile(`data/facilita-bundle-${client}.json`, JSON.stringify(bundle));
    const detailCount = Object.keys(bundle.details).length;
    console.log(`[${client}] pronto em ${((Date.now() - t0) / 1000).toFixed(0)}s — ${bundle.deals.length} negocios, ${detailCount} detalhados`);
  }
}

main().catch((err) => {
  console.error('Falha ao coletar bundle da Facilita:', err);
  process.exit(1);
});
