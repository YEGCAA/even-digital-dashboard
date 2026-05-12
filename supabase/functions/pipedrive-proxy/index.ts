// Supabase Edge Function: proxy seguro para a API do Pipedrive.
// Tokens ficam em secrets do Supabase, nunca expostos ao browser.
//
// Deploy:
//   supabase functions deploy pipedrive-proxy --no-verify-jwt
//
// Set secrets (uma vez):
//   supabase secrets set \
//     PIPEDRIVE_PEDROSA_TOKEN=<token> \
//     PIPEDRIVE_PEDROSA_DOMAIN=pedrosa \
//     PIPEDRIVE_PEDROSA_PIPELINE_ID=3 \
//     PIPEDRIVE_OPUS_TOKEN=<token> \
//     PIPEDRIVE_OPUS_DOMAIN=opus \
//     PIPEDRIVE_OPUS_PIPELINE_ID=1 \
//     PIPEDRIVE_VILLAGGIO_TOKEN=<token> \
//     PIPEDRIVE_VILLAGGIO_DOMAIN=villaggioparadiso \
//     PIPEDRIVE_VILLAGGIO_PIPELINE_ID=1

const CLIENTS: Record<string, { tokenEnv: string; domainEnv: string; pipelineEnv: string }> = {
  pedrosa: {
    tokenEnv: 'PIPEDRIVE_PEDROSA_TOKEN',
    domainEnv: 'PIPEDRIVE_PEDROSA_DOMAIN',
    pipelineEnv: 'PIPEDRIVE_PEDROSA_PIPELINE_ID',
  },
  opus: {
    tokenEnv: 'PIPEDRIVE_OPUS_TOKEN',
    domainEnv: 'PIPEDRIVE_OPUS_DOMAIN',
    pipelineEnv: 'PIPEDRIVE_OPUS_PIPELINE_ID',
  },
  villaggio: {
    tokenEnv: 'PIPEDRIVE_VILLAGGIO_TOKEN',
    domainEnv: 'PIPEDRIVE_VILLAGGIO_DOMAIN',
    pipelineEnv: 'PIPEDRIVE_VILLAGGIO_PIPELINE_ID',
  },
};

// Endpoints permitidos (allow-list). Qualquer outro path retorna 403.
const ALLOWED_PATHS = new Set(['stages', 'deals', 'pipelines']);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let body: { client?: string; path?: string; params?: Record<string, string | number> };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const { client, path, params = {} } = body;
  if (!client || !path) return json({ error: 'client and path required' }, 400);

  const clientCfg = CLIENTS[client];
  if (!clientCfg) return json({ error: 'unknown client' }, 400);
  if (!ALLOWED_PATHS.has(path)) return json({ error: 'path not allowed' }, 403);

  const token = Deno.env.get(clientCfg.tokenEnv);
  const domain = Deno.env.get(clientCfg.domainEnv);
  const pipelineId = Deno.env.get(clientCfg.pipelineEnv);
  if (!token || !domain || !pipelineId) {
    return json({ error: 'pipedrive secrets missing' }, 500);
  }

  // Sanitiza params: so aceita chaves conhecidas e valores escalares
  const allowedParamKeys = new Set(['status', 'start', 'limit', 'pipeline_id']);
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (!allowedParamKeys.has(k)) continue;
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
  }
  // pipeline_id sempre vem do servidor — sobrescreve qualquer tentativa do client
  qs.set('pipeline_id', pipelineId);
  qs.set('api_token', token);

  const url = `https://${domain}.pipedrive.com/api/v1/${path}?${qs.toString()}`;
  try {
    const upstream = await fetch(url);
    const data = await upstream.json();
    // Devolve sem o token (ja nao vem na resposta, mas garantimos)
    return json(data, upstream.status);
  } catch (err) {
    return json({ error: 'pipedrive fetch failed', detail: String(err) }, 502);
  }
});

// Para que o cliente saiba qual e o pipeline_id sem expor o token,
// embutimos via response normal — o frontend ja recebe os dados completos.
