// Espelho do pipedriveService: snapshot agregado por cliente.

import { CreativePlayback } from '../types';

const GRAPH_VERSION = 'v21.0';
const META_TOKEN = process.env.META_ACCESS_TOKEN || '';

// user.id (logins) -> ad_account_id no Meta Ads
// Villaggio (id 6) fora por enquanto: campanha do Meta vinculada e' antiga
// (de outra agencia). Quando subir a campanha nova, reativar com:
//   6: 'act_900981759160832', // Villaggio
export const META_ACCOUNT_BY_USER_ID: Record<number, string> = {
  2: 'act_1107966070778536', // Pedrosa
  3: 'act_1722410995784956', // Opus (vmb_inc)
  4: 'act_825307016532821',  // Lani
  5: 'act_847018621762805',  // M One
};

export interface MetaMarketingSnapshot {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  ctr: number;       // porcentagem (0..100)
  clicks: number;
  pageViews: number; // landing_page_view (visitas a pagina apos clique)
  leads: number;
  cpm: number;
  cpc: number;
  cpl: number;
  creativePlayback: CreativePlayback[];
  // Linhas por anuncio por dia, no formato das antigas tabelas Marketing_X
  // (chaves "Date", "Ad Name", "Campaign", "Ad Set Name", "Amount Spent", ...).
  // Servem pros filtros (Campanhas/Conjuntos/Anuncios) e graficos de evolucao.
  marketingRows: any[];
  adAccount: string;
  fetchedAt: number;
}

const toNum = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

// Conta leads usando SO action_type='lead'. O Meta retorna o mesmo numero
// de leads sob varios action_types (onsite_web_lead, offsite_conversion.fb_pixel_lead,
// offsite_lead_add_20_s_calls, etc.), entao somar "tudo que contem lead" inflaria 4x.
const sumLeadActions = (actions: any[] | undefined): number => {
  if (!Array.isArray(actions)) return 0;
  for (const a of actions) {
    if (a?.action_type === 'lead') return toNum(a.value);
  }
  return 0;
};

const findAction = (actions: any[] | undefined, type: string): number => {
  if (!Array.isArray(actions)) return 0;
  const a = actions.find(x => x?.action_type === type);
  return a ? toNum(a.value) : 0;
};

// 3-second video views: o campo dedicado `video_3_sec_watched_actions` foi
// removido. Agora a contagem vem no array `actions` com action_type=video_view.
const sum3sViews = (actions: any[] | undefined): number => {
  if (!Array.isArray(actions)) return 0;
  let total = 0;
  for (const a of actions) {
    if (String(a?.action_type || '').toLowerCase() === 'video_view') total += toNum(a?.value);
  }
  return total;
};

const sumVideoAction = (arr: any[] | undefined): number => {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((acc, x) => acc + toNum(x?.value), 0);
};

// Constroi `time_range` JSON pra Graph API a partir de YYYY-MM-DD opcionais.
const buildTimeRange = (dateStart?: string, dateEnd?: string): string | null => {
  if (!dateStart && !dateEnd) return null;
  const today = new Date().toISOString().slice(0, 10);
  return JSON.stringify({ since: dateStart || '2020-01-01', until: dateEnd || today });
};

const fetchAllPages = async (initialUrl: string): Promise<any[]> => {
  const all: any[] = [];
  let url: string | null = initialUrl;
  for (let i = 0; i < 50 && url; i++) {
    const res: Response = await fetch(url);
    const data: any = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Meta API ${res.status}`);
    }
    if (Array.isArray(data.data)) all.push(...data.data);
    url = data.paging?.next || null;
  }
  return all;
};

// Cache em localStorage. Reduz chamadas redundantes ao Meta Graph API
// quando o usuario recarrega a pagina ou alterna entre abas dentro do TTL.
const META_CACHE_TTL_MS = 10 * 60_000; // 10 minutos
const metaCacheKey = (a: string, s?: string, e?: string) => `meta_cache_${a}_${s||'_'}_${e||'_'}`;
const readMetaCache = (k: string): MetaMarketingSnapshot | null => {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetaMarketingSnapshot;
    if (!parsed.fetchedAt || Date.now() - parsed.fetchedAt > META_CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
};
const writeMetaCache = (k: string, snap: MetaMarketingSnapshot) => {
  try { localStorage.setItem(k, JSON.stringify(snap)); } catch {}
};

// Snapshot de marketing para um ad account. Sem `date*` traz tudo (maximum).
// Com date* faz scopagem no servidor (mais eficiente).
export const fetchMetaSnapshot = async (
  adAccount: string,
  dateStart?: string,
  dateEnd?: string
): Promise<MetaMarketingSnapshot> => {
  if (!META_TOKEN) throw new Error('META_ACCESS_TOKEN ausente');
  const ckey = metaCacheKey(adAccount, dateStart, dateEnd);
  const cached = readMetaCache(ckey);
  if (cached) return cached;

  const timeRange = buildTimeRange(dateStart, dateEnd);

  // 1) summary do nivel da conta — uma linha agregada
  const accParams = new URLSearchParams({
    access_token: META_TOKEN,
    level: 'account',
    fields: 'spend,impressions,reach,frequency,ctr,inline_link_clicks,actions',
  });
  if (timeRange) accParams.set('time_range', timeRange);
  else accParams.set('date_preset', 'maximum');

  // 2) por anuncio agregado (no periodo todo) — pra metricas de video do CreativePlayback
  const adParams = new URLSearchParams({
    access_token: META_TOKEN,
    level: 'ad',
    limit: '500',
    fields: [
      'ad_name', 'adset_name', 'campaign_name',
      'actions',
      'video_p25_watched_actions',
      'video_p50_watched_actions',
      'video_p75_watched_actions',
      'video_p95_watched_actions',
      'video_p100_watched_actions',
    ].join(','),
  });
  if (timeRange) adParams.set('time_range', timeRange);
  else adParams.set('date_preset', 'maximum');

  // 3) por anuncio + por dia — alimenta filtros (Campanhas/Conjuntos/Anuncios)
  // e o grafico de Geracao de Leads ao longo do tempo.
  const dailyParams = new URLSearchParams({
    access_token: META_TOKEN,
    level: 'ad',
    time_increment: '1',
    limit: '500',
    fields: [
      'date_start',
      'ad_name', 'adset_name', 'campaign_name',
      'spend', 'impressions', 'reach', 'frequency', 'ctr',
      'inline_link_clicks', 'actions',
    ].join(','),
  });
  if (timeRange) dailyParams.set('time_range', timeRange);
  else dailyParams.set('date_preset', 'maximum');

  // 4) por campanha — espelha a tabela do Ads Manager.
  // reach: soma com overlap. CPM/CPC: soma das campanhas. Frequencia/CTR: media.
  const campaignParams = new URLSearchParams({
    access_token: META_TOKEN,
    level: 'campaign',
    limit: '500',
    fields: 'reach,frequency,cpm,cost_per_inline_link_click,inline_link_click_ctr',
  });
  if (timeRange) campaignParams.set('time_range', timeRange);
  else campaignParams.set('date_preset', 'maximum');

  const accUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${adAccount}/insights?${accParams.toString()}`;
  const adUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${adAccount}/insights?${adParams.toString()}`;
  const dailyUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${adAccount}/insights?${dailyParams.toString()}`;
  const campaignUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${adAccount}/insights?${campaignParams.toString()}`;

  const [accRows, adRows, dailyRows, campaignRows] = await Promise.all([
    fetchAllPages(accUrl),
    fetchAllPages(adUrl),
    fetchAllPages(dailyUrl),
    fetchAllPages(campaignUrl),
  ]);

  const acc = accRows[0] || {};
  const spend = toNum(acc.spend);
  const impressions = toNum(acc.impressions);
  // Reach = SOMA do reach por campanha (com overlap) — replica visualmente
  // a coluna "Alcance" do Ads Manager.
  const reach = campaignRows.reduce((acc, r: any) => acc + toNum(r.reach), 0);
  const clicks = toNum(acc.inline_link_clicks);
  const leads = sumLeadActions(acc.actions);
  const pageViews = findAction(acc.actions, 'landing_page_view');
  // Frequencia e CTR: MEDIA simples das campanhas (somar e dividir pelo numero).
  // CPM e CPC: SOMA das campanhas (replica visualmente a coluna do Ads Manager).
  // So conta campanhas com valor > 0 pra nao distorcer a media com inativas.
  const freqValues = campaignRows.map((r: any) => toNum(r.frequency)).filter(v => v > 0);
  const ctrValues = campaignRows.map((r: any) => toNum(r.inline_link_click_ctr)).filter(v => v > 0);
  const frequency = freqValues.length > 0 ? freqValues.reduce((a, b) => a + b, 0) / freqValues.length : 0;
  const ctr = ctrValues.length > 0 ? ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length : 0;
  const cpmSum = campaignRows.reduce((a, r: any) => a + toNum(r.cpm), 0);
  const cpcSum = campaignRows.reduce((a, r: any) => a + toNum(r.cost_per_inline_link_click), 0);

  const creativeMap: Record<string, CreativePlayback> = {};
  for (const r of adRows) {
    const key = String(r.ad_name || 'Sem Nome');
    if (!creativeMap[key]) {
      creativeMap[key] = {
        adName: key,
        campaign: String(r.campaign_name || 'N/A'),
        adSet: String(r.adset_name || 'N/A'),
        views3s: 0, p25: 0, p50: 0, p75: 0, p95: 0, p100: 0, retentionRate: 0,
        date: '',
      };
    }
    creativeMap[key].views3s += sum3sViews(r.actions);
    creativeMap[key].p25 += sumVideoAction(r.video_p25_watched_actions);
    creativeMap[key].p50 += sumVideoAction(r.video_p50_watched_actions);
    creativeMap[key].p75 += sumVideoAction(r.video_p75_watched_actions);
    creativeMap[key].p95 += sumVideoAction(r.video_p95_watched_actions);
    creativeMap[key].p100 += sumVideoAction(r.video_p100_watched_actions);
  }
  const creativePlayback = Object.values(creativeMap)
    .map(c => ({ ...c, retentionRate: c.views3s > 0 ? (c.p100 / c.views3s) * 100 : 0 }))
    .sort((a, b) => b.p100 - a.p100);

  // Monta linhas no formato Marketing_X (chaves com espacos/maiusculas que
  // o dashboard ja conhece) — alimenta filtros e graficos.
  const marketingRows = dailyRows.map((r: any) => ({
    Date: r.date_start || '',
    'Ad Name': r.ad_name || 'Sem Nome',
    Campaign: r.campaign_name || 'N/A',
    'Ad Set Name': r.adset_name || 'N/A',
    'Amount Spent': toNum(r.spend),
    Impressions: toNum(r.impressions),
    Reach: toNum(r.reach),
    Frequency: toNum(r.frequency),
    CTR: toNum(r.ctr),
    'Link Clicks': toNum(r.inline_link_clicks),
    Leads: sumLeadActions(r.actions),
  }));

  const snapshot: MetaMarketingSnapshot = {
    spend, impressions, reach, frequency, ctr, clicks, pageViews, leads,
    cpm: cpmSum,
    cpc: cpcSum,
    cpl: leads > 0 ? spend / leads : 0,
    creativePlayback,
    marketingRows,
    adAccount,
    fetchedAt: Date.now(),
  };
  writeMetaCache(ckey, snapshot);
  return snapshot;
};

// Soma snapshots (admin com varios clientes selecionados)
export const aggregateMetaSnapshots = (snaps: MetaMarketingSnapshot[]): MetaMarketingSnapshot | null => {
  if (snaps.length === 0) return null;
  if (snaps.length === 1) return snaps[0];

  let spend = 0, impressions = 0, reach = 0, clicks = 0, pageViews = 0, leads = 0;
  let freqWeight = 0, ctrWeight = 0, impForWeight = 0;
  const creativeMap: Record<string, CreativePlayback> = {};
  const marketingRows: any[] = [];

  for (const s of snaps) {
    spend += s.spend;
    impressions += s.impressions;
    reach += s.reach;
    clicks += s.clicks;
    pageViews += s.pageViews;
    leads += s.leads;
    if (s.impressions > 0) {
      freqWeight += s.frequency * s.impressions;
      ctrWeight += s.ctr * s.impressions;
      impForWeight += s.impressions;
    }
    for (const c of s.creativePlayback) {
      const k = c.adName;
      if (!creativeMap[k]) {
        creativeMap[k] = { ...c };
      } else {
        creativeMap[k].views3s += c.views3s;
        creativeMap[k].p25 += c.p25;
        creativeMap[k].p50 += c.p50;
        creativeMap[k].p75 += c.p75;
        creativeMap[k].p95 += c.p95;
        creativeMap[k].p100 += c.p100;
      }
    }
    marketingRows.push(...s.marketingRows);
  }
  const creativePlayback = Object.values(creativeMap)
    .map(c => ({ ...c, retentionRate: c.views3s > 0 ? (c.p100 / c.views3s) * 100 : 0 }))
    .sort((a, b) => b.p100 - a.p100);

  const frequency = impForWeight > 0 ? freqWeight / impForWeight : 0;
  const ctr = impForWeight > 0 ? ctrWeight / impForWeight : 0;

  return {
    spend, impressions, reach, frequency, ctr, clicks, pageViews, leads,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpl: leads > 0 ? spend / leads : 0,
    creativePlayback,
    marketingRows,
    adAccount: 'aggregated',
    fetchedAt: Date.now(),
  };
};
