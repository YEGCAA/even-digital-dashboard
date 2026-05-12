// ATENCAO: por agora os tokens estao no bundle JS (visiveis via F12).
// O caminho seguro e' a Edge Function em supabase/functions/pipedrive-proxy/.
// Quando deployar a function, basta voltar este arquivo a versao com proxy.

interface PipedriveConfig {
  token: string;
  domain: string;
  pipelineId: number;
}

const CONFIGS: Record<string, PipedriveConfig> = {
  pedrosa: {
    token: process.env.PIPEDRIVE_PEDROSA_TOKEN || '',
    domain: process.env.PIPEDRIVE_PEDROSA_DOMAIN || '',
    pipelineId: Number(process.env.PIPEDRIVE_PEDROSA_PIPELINE_ID || 0),
  },
  opus: {
    token: process.env.PIPEDRIVE_OPUS_TOKEN || '',
    domain: process.env.PIPEDRIVE_OPUS_DOMAIN || '',
    pipelineId: Number(process.env.PIPEDRIVE_OPUS_PIPELINE_ID || 0),
  },
  villaggio: {
    token: process.env.PIPEDRIVE_VILLAGGIO_TOKEN || '',
    domain: process.env.PIPEDRIVE_VILLAGGIO_DOMAIN || '',
    pipelineId: Number(process.env.PIPEDRIVE_VILLAGGIO_PIPELINE_ID || 0),
  },
};

export const PIPEDRIVE_CLIENT_KEYS = ['pedrosa', 'opus', 'villaggio'] as const;
export type PipedriveClientKey = typeof PIPEDRIVE_CLIENT_KEYS[number];

export interface PipedriveStage {
  id: number;
  name: string;
  order_nr: number;
  pipeline_id: number;
}

interface RawPipedriveDeal {
  id: number;
  stage_id: number;
  status: 'open' | 'won' | 'lost' | 'deleted';
  value: number;
  currency: string;
  add_time: string;
  title: string;
  person_id?: {
    name?: string;
    email?: Array<{ value: string; primary: boolean }>;
    phone?: Array<{ value: string; primary: boolean }>;
    value?: number;
  } | null;
  person_name?: string;
}

export interface PipedriveLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  addTime: string;
  stageName: string;
  value: number;
  status: 'open' | 'won' | 'lost';
}

export interface PipedriveStageStat {
  stageId: number;
  stageName: string;
  order: number;
  count: number;
  cumulativeCount: number;
  value: number;
  percent: number;
}

export interface PipedrivePipelineSnapshot {
  pipelineId: number;
  pipelineName: string;
  stages: PipedriveStageStat[];
  totalDeals: number;
  totalValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  totalLeadsAllStatuses: number;
  openLeads: PipedriveLead[];
  wonLeads: PipedriveLead[];
  lostLeads: PipedriveLead[];
  fetchedAt: number;
}

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pipedrive HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error('Pipedrive API returned success=false');
  return json;
};

const fetchAllDeals = async (cfg: PipedriveConfig, status: 'open' | 'won' | 'lost'): Promise<RawPipedriveDeal[]> => {
  const base = `https://${cfg.domain}.pipedrive.com/api/v1`;
  const all: RawPipedriveDeal[] = [];
  let start = 0;
  const limit = 500;
  for (let page = 0; page < 20; page++) {
    const url = `${base}/deals?status=${status}&pipeline_id=${cfg.pipelineId}&start=${start}&limit=${limit}&api_token=${cfg.token}`;
    const json = await fetchJson(url);
    const deals = (json.data || []) as RawPipedriveDeal[];
    all.push(...deals);
    const more = json.additional_data?.pagination?.more_items_in_collection;
    if (!more) break;
    start += limit;
  }
  return all;
};

const extractPerson = (d: RawPipedriveDeal) => {
  const p = d.person_id;
  const name = (typeof p === 'object' && p?.name) || d.person_name || d.title || 'Sem nome';
  const email = p?.email?.find(e => e.primary)?.value || p?.email?.[0]?.value || '';
  const phone = p?.phone?.find(e => e.primary)?.value || p?.phone?.[0]?.value || '';
  return { name, email, phone };
};

export const fetchPipedrivePipeline = async (client: PipedriveClientKey): Promise<PipedrivePipelineSnapshot> => {
  const cfg = CONFIGS[client];
  if (!cfg || !cfg.token || !cfg.domain || !cfg.pipelineId) {
    throw new Error(`Pipedrive nao configurado para cliente: ${client}`);
  }
  const base = `https://${cfg.domain}.pipedrive.com/api/v1`;

  const [stagesJson, openDeals, wonDeals, lostDeals] = await Promise.all([
    fetchJson(`${base}/stages?pipeline_id=${cfg.pipelineId}&api_token=${cfg.token}`),
    fetchAllDeals(cfg, 'open'),
    fetchAllDeals(cfg, 'won'),
    fetchAllDeals(cfg, 'lost'),
  ]);

  const stagesData = (stagesJson.data || []) as PipedriveStage[];
  const stages = stagesData.filter(s => s.pipeline_id === cfg.pipelineId);
  const stageIds = new Set(stages.map(s => s.id));
  const stageOrderById = new Map(stages.map(s => [s.id, s.order_nr]));
  const maxOrder = stages.reduce((m, s) => Math.max(m, s.order_nr), 0);
  const pipelineName = (stagesData[0] as any)?.pipeline_name?.trim() || 'Pipeline';

  const openInPipeline = openDeals.filter(d => stageIds.has(d.stage_id));
  const wonInPipeline = wonDeals.filter(d => stageIds.has(d.stage_id));
  const lostInPipeline = lostDeals.filter(d => stageIds.has(d.stage_id));

  const totalLeadsAllStatuses =
    openInPipeline.length + wonInPipeline.length + lostInPipeline.length;

  const allWithOrder = [
    ...openInPipeline.map(d => ({ d, order: stageOrderById.get(d.stage_id) ?? 0, status: 'open' as const })),
    ...wonInPipeline.map(d => ({ d, order: maxOrder, status: 'won' as const })),
    ...lostInPipeline.map(d => ({ d, order: stageOrderById.get(d.stage_id) ?? 0, status: 'lost' as const })),
  ];

  const stageStats: PipedriveStageStat[] = stages
    .sort((a, b) => a.order_nr - b.order_nr)
    .map(s => {
      const dealsCurrentlyHere = openInPipeline.filter(d => d.stage_id === s.id);
      const cumulative = allWithOrder.filter(x => x.order >= s.order_nr).length;
      return {
        stageId: s.id,
        stageName: s.name.trim(),
        order: s.order_nr,
        count: dealsCurrentlyHere.length,
        cumulativeCount: cumulative,
        value: dealsCurrentlyHere.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
        percent: totalLeadsAllStatuses > 0
          ? (cumulative / totalLeadsAllStatuses) * 100
          : 0,
      };
    });

  const toLead = (status: 'open' | 'won' | 'lost') => (d: RawPipedriveDeal): PipedriveLead => {
    const { name, email, phone } = extractPerson(d);
    return {
      id: d.id,
      name,
      email,
      phone,
      addTime: d.add_time,
      stageName: stages.find(s => s.id === d.stage_id)?.name?.trim() || '—',
      value: Number(d.value) || 0,
      status,
    };
  };
  const sortByDate = (a: PipedriveLead, b: PipedriveLead) =>
    (b.addTime || '').localeCompare(a.addTime || '');

  const openLeads: PipedriveLead[] = openInPipeline.map(toLead('open')).sort(sortByDate);
  const wonLeads: PipedriveLead[] = wonInPipeline.map(toLead('won')).sort(sortByDate);
  const lostLeads: PipedriveLead[] = lostInPipeline.map(toLead('lost')).sort(sortByDate);

  return {
    pipelineId: cfg.pipelineId,
    pipelineName,
    stages: stageStats,
    totalDeals: openInPipeline.length,
    totalValue: openInPipeline.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
    wonCount: wonInPipeline.length,
    wonValue: wonInPipeline.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
    lostCount: lostInPipeline.length,
    totalLeadsAllStatuses,
    openLeads,
    wonLeads,
    lostLeads,
    fetchedAt: Date.now(),
  };
};

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s_]/g, '');

export const findStage = (
  snapshot: PipedrivePipelineSnapshot | null,
  ...candidates: string[]
): PipedriveStageStat | null => {
  if (!snapshot) return null;
  for (const c of candidates) {
    const n = norm(c);
    const hit = snapshot.stages.find(s => {
      const sn = norm(s.stageName);
      return sn === n || sn.includes(n) || n.includes(sn);
    });
    if (hit) return hit;
  }
  return null;
};
