// Supabase Edge Function: proxy seguro para a Meta Graph API (Facebook Ads).
// O token fica em secret do Supabase, nunca exposto ao browser.
//
// Deploy:
//   supabase functions deploy meta-proxy --no-verify-jwt
//
// Set secret (uma vez):
//   supabase secrets set META_ACCESS_TOKEN=EAA...

const GRAPH_VERSION = 'v21.0';

// Allow-list de ad accounts. Qualquer act_id fora daqui retorna 403.
const ALLOWED_AD_ACCOUNTS = new Set<string>([
  'act_1107966070778536', // Pedrosa
  'act_1722410995784956', // Opus
  'act_825307016532821',  // Lani
  'act_847018621762805',  // M One
  'act_900981759160832',  // Villaggio
]);

const ALLOWED_PATHS = new Set<string>(['daily_ad_insights']);

// Janela maxima retroativa de insights (em dias) — limita o volume de dados
// e mantem o tempo de resposta da function razoavel.
const LOOKBACK_DAYS = 365;

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

interface RequestBody {
  adAccount?: string;
  path?: 'daily_ad_insights';
}

const fetchAllPages = async (initialUrl: string): Promise<any[]> => {
  const all: any[] = [];
  let url: string | null = initialUrl;
  for (let i = 0; i < 100 && url; i++) {
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

const todayISO = (): string => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const { adAccount, path } = body;
  if (!adAccount || !path) return json({ error: 'adAccount and path required' }, 400);
  if (!ALLOWED_AD_ACCOUNTS.has(adAccount)) return json({ error: 'ad account not allowed' }, 403);
  if (!ALLOWED_PATHS.has(path)) return json({ error: 'path not allowed' }, 403);

  const token = Deno.env.get('META_ACCESS_TOKEN');
  if (!token) return json({ error: 'META_ACCESS_TOKEN secret missing' }, 500);

  // Insights diarios por anuncio, ultimos LOOKBACK_DAYS dias
  const timeRange = JSON.stringify({ since: daysAgoISO(LOOKBACK_DAYS), until: todayISO() });
  const params = new URLSearchParams({
    access_token: token,
    level: 'ad',
    time_increment: '1',
    limit: '500',
    time_range: timeRange,
    fields: [
      'ad_id',
      'ad_name',
      'adset_name',
      'campaign_name',
      'date_start',
      'date_stop',
      'spend',
      'impressions',
      'reach',
      'frequency',
      'ctr',
      'inline_link_clicks',
      'actions',
      'video_p25_watched_actions',
      'video_p50_watched_actions',
      'video_p75_watched_actions',
      'video_p95_watched_actions',
      'video_p100_watched_actions',
      'video_3_sec_watched_actions',
    ].join(','),
  });
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${adAccount}/insights?${params.toString()}`;

  try {
    const data = await fetchAllPages(url);
    return json({ data });
  } catch (err: any) {
    return json({ error: 'meta fetch failed', detail: err?.message || String(err) }, 502);
  }
});
