
import { DashboardData, FunnelStage, ClientLead, CreativePlayback } from '../types';
import { supabase } from './supabase';

const parseNumeric = (val: any): number => {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === 'number') return val;
  
  let s = val.toString().replace(/[R$\sBRL]/g, '').trim();
  
  while (s.length > 0 && !/[0-9]/.test(s.slice(-1))) {
    s = s.slice(0, -1).trim();
  }
  
  if (!s) return 0;

  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    const parts = s.split(',');
    if (parts[parts.length - 1].length <= 2) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(',', '');
    }
  } else if (s.includes('.')) {
    const parts = s.split('.');
    if (parts[parts.length - 1].length > 2) {
      s = s.replace(/\./g, '');
    }
  }
  
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
};

const normalizeStr = (s: string) => s.toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
  .replace(/[\s_]/g, '');

const findValue = (row: any, keys: string[]) => {
  if (!row) return null;
  const rowKeys = Object.keys(row);
  
  for (const key of keys) {
    const normalizedSearchKey = normalizeStr(key);
    const found = rowKeys.find(rk => {
      const normalizedRowKey = normalizeStr(rk);
      return normalizedRowKey === normalizedSearchKey || normalizedRowKey.includes(normalizedSearchKey);
    });
    if (found && row[found] !== null && row[found] !== "" && row[found] !== undefined) {
      return row[found];
    }
  }
  return null;
};

const PREFERRED_ORDER = [
  "entrada do lead",
  "qualificado",
  "mensagem inicial",
  "tentativa de contato",
  "em atendimento",
  "lead futuro",
  "pre agendamento",
  "reuniao agendada",
  "reuniao realizada",
  "proposta enviada",
  "vendas concluidas"
];

const generateColor = (name: string): string => {
  const n = normalizeStr(name);
  if (n.includes("venda") || n.includes("concluid")) return '#10b981'; 
  const idx = PREFERRED_ORDER.findIndex(term => n.includes(normalizeStr(term)));
  if (idx === -1) return '#94a3b8';
  return `hsl(214, 66%, ${Math.max(25, 85 - (idx * (50 / PREFERRED_ORDER.length)))}%)`;
};

export const processSupabaseData = (rows: any[], fetchedTables: string[] = [], rawDataByTable: Record<string, any[]> = {}): DashboardData => {
  let totalUnits = 0;
  let totalVGV = 0;
  let projectName = "Even Digital";
  
  let totalSpend = 0; 
  let totalMarketingLeads = 0;
  let totalReach = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalSalesValue = 0; 
  let countVendasID14 = 0;
  
  const stageCounts: Record<string, number> = {};
  PREFERRED_ORDER.forEach(stage => {
    const officialName = stage.charAt(0).toUpperCase() + stage.slice(1);
    stageCounts[officialName] = 0;
  });

  const leadsList: ClientLead[] = [];
  const creativeMap: Record<string, CreativePlayback> = {};
  
  let sumFreq = 0;
  let countFreqRows = 0;

  const marketingTableName = fetchedTables.find(t => t.toLowerCase().includes('marketing'));
  const salesTableName = fetchedTables.find(t => t.toLowerCase().includes('venda'));
  const dadosTableName = fetchedTables.find(t => t.toLowerCase().includes('dados'));

  const marketingRows = marketingTableName ? rawDataByTable[marketingTableName] : [];
  const salesRows = salesTableName ? rawDataByTable[salesTableName] : [];
  const dadosRows = dadosTableName ? rawDataByTable[dadosTableName] : [];

  const infoSource = dadosRows.length > 0 ? dadosRows : rows;
  for (let i = infoSource.length - 1; i >= 0; i--) {
    const row = infoSource[i];
    const u = findValue(row, ["unidades", "total unidades", "units", "quantidade", "qtd", "unid", "unidade"]);
    const valU = parseNumeric(u);
    if (valU > 0 && totalUnits === 0) totalUnits = valU;

    const v = findValue(row, ["VGV", "valor geral vendas", "vgv total", "valor", "v_total", "valor_geral"]);
    const valV = parseNumeric(v);
    if (valV > 0 && totalVGV === 0) totalVGV = valV;

    const name = findValue(row, ["nome do empreendimento", "projeto", "empreendimento", "client", "cliente", "nome_projeto"]);
    if (name && projectName === "Even Digital") projectName = name;
  }

  marketingRows.forEach((row) => {
    const spend = parseNumeric(findValue(row, ["Amount Spent", "investimento", "valor gasto", "custo", "gastos", "spent"]));
    totalSpend += spend;
    
    const leads = parseNumeric(findValue(row, ["leads", "lead count", "leads_gerados", "results", "resultados", "leads fb", "leads google"]));
    totalMarketingLeads += leads;

    totalReach += parseNumeric(findValue(row, ["Reach", "Alcance"]));
    totalImpressions += parseNumeric(findValue(row, ["Impressions", "Impressoes"]));
    totalClicks += parseNumeric(findValue(row, ["Link Clicks", "Cliques", "Clicks"]));

    const freq = parseNumeric(findValue(row, ["Frequency", "Frequencia", "frequency_score"]));
    if (freq > 0) {
      sumFreq += freq;
      countFreqRows++;
    }

    const adName = findValue(row, ["Ad Name", "Nome do Anuncio", "Anuncio", "ad_name", "Anúncio"]) || "Sem Nome";
    const dateValue = findValue(row, ["Date", "Day", "dia", "data", "created_at"]) || "";
    
    const v3s = parseNumeric(findValue(row, ["3-Second Video Views", "3_sec_video_views", "Video Plays 3s"]));
    const p25 = parseNumeric(findValue(row, ["Video Watches at 25%", "video_p25_watched_actions", "Video P25"]));
    const p50 = parseNumeric(findValue(row, ["Video Watches at 50%", "video_p50_watched_actions", "Video P50"]));
    const p75 = parseNumeric(findValue(row, ["Video Watches at 75%", "video_p75_watched_actions", "Video P75"]));
    const p95 = parseNumeric(findValue(row, ["Video Watches at 95%", "video_p95_watched_actions", "Video P95"]));
    const p100 = parseNumeric(findValue(row, ["Video Watches at 100%", "video_p100_watched_actions", "Video P100"]));

    if (!creativeMap[adName]) {
      creativeMap[adName] = { adName, views3s: 0, p25: 0, p50: 0, p75: 0, p95: 0, p100: 0, retentionRate: 0, date: String(dateValue) };
    }
    creativeMap[adName].views3s += v3s;
    creativeMap[adName].p25 += p25;
    creativeMap[adName].p50 += p50;
    creativeMap[adName].p75 += p75;
    creativeMap[adName].p95 += p95;
    creativeMap[adName].p100 += p100;
  });

  const creativePlayback: CreativePlayback[] = Object.values(creativeMap)
    .map(c => ({
      ...c,
      retentionRate: c.views3s > 0 ? (c.p100 / c.views3s) * 100 : 0
    }))
    .sort((a, b) => b.p100 - a.p100 || b.views3s - a.views3s);

  salesRows.forEach((row, index) => {
    const stageNameRaw = findValue(row, ["Nome Etapa", "Status", "etapa", "fase", "status_lead", "fase_funil"]);
    const stageIdRaw = findValue(row, ["ID Etapa", "Etapa ID", "status_id", "id_etapa", "stage_id", "id", "id etapa"]);
    const stageId = stageIdRaw ? String(stageIdRaw).trim() : "";
    const stageName = stageNameRaw ? String(stageNameRaw).trim() : "";
    const stageNorm = normalizeStr(stageName);

    const isVendaConcluida = stageId === "14" || stageNorm.includes("vendasconcluidas") || stageNorm.includes("vendasconcluida");

    if (isVendaConcluida) {
      const rowValRaw = findValue(row, ["valor", "vaor", "venda", "price", "amount"]);
      const rowVal = parseNumeric(rowValRaw);
      const rowQty = parseNumeric(findValue(row, ["quantidade", "qtd", "units_sold", "volume", "unid", "unidades"]));
      const multiplier = rowQty > 0 ? rowQty : 1;
      totalSalesValue += (rowVal * multiplier);
      countVendasID14++;
      stageCounts["Vendas concluidas"] = (stageCounts["Vendas concluidas"] || 0) + 1;
    } else if (stageName) {
      const matchedStage = PREFERRED_ORDER.find(term => stageNorm.includes(normalizeStr(term)));
      if (matchedStage) {
        const officialName = matchedStage.charAt(0).toUpperCase() + matchedStage.slice(1);
        if (officialName !== "Vendas concluidas") {
          stageCounts[officialName] = (stageCounts[officialName] || 0) + 1;
        }
      }
    }

    const leadName = findValue(row, ["nome", "name", "cliente", "customer name", "lead"]);
    if (leadName) {
      leadsList.push({
        id: `lead-${index}-${Math.random().toString(36).substr(2, 9)}`,
        name: String(leadName) || "Sem Nome",
        email: String(findValue(row, ["email", "e-mail", "mail"]) || "Sem E-mail"),
        phone: String(findValue(row, ["telefone", "phone", "whatsapp", "celular"]) || "---"),
        businessTitle: String(findValue(row, ["titulo do negocio", "negocio", "deal title", "business"]) || "---"),
        pipeline: String(findValue(row, ["pipeline", "funil", "board", "Pipeline"]) || "Padrão"),
        stage: stageName || "Sem Etapa",
        date: String(findValue(row, ["data", "created_at", "date", "dia"]) || "---")
      });
    }
  });

  // O total de Leads Geral (Overview) vem do CRM
  const realTotalLeads = leadsList.length;

  // No Marketing, o CPL é baseado nos leads REPORTADOS pelas plataformas quando houver filtros,
  // mas se não houver filtro, usamos os leads de marketing capturados.
  const leadsForMarketingCalculations = totalMarketingLeads > 0 ? totalMarketingLeads : realTotalLeads;

  const averageCPL = leadsForMarketingCalculations > 0 ? totalSpend / leadsForMarketingCalculations : 0;
  const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const averageCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const averageFreq = countFreqRows > 0 ? sumFreq / countFreqRows : 1;

  const funnelStages: FunnelStage[] = PREFERRED_ORDER.map(term => {
    const officialName = term.charAt(0).toUpperCase() + term.slice(1);
    return {
      stage: officialName,
      count: stageCounts[officialName] || 0,
      color: generateColor(term)
    };
  });

  return {
    metrics: {
      totalRevenue: totalSalesValue,
      revenuePerUnitManaged: totalUnits > 0 ? totalVGV / totalUnits : 0,
      unitsSoldPerWeek: 0,
      preLaunchSoldRatio: 0,
      conversionRateLeadToSale: 0,
      qualifiedLeadRatio: 0,
      cac: averageCPL, // CAC/CPL Base
      totalUnitsSold: countVendasID14,
      totalLeads: realTotalLeads,
      totalSpend: totalSpend,
      marketingMetrics: { 
        cpm: averageCPM, 
        ctr: averageCTR, 
        cpc: averageCPC, 
        frequency: averageFreq, 
        cpl: averageCPL, 
        reach: totalReach,
        impressions: totalImpressions,
        clicks: totalClicks,
        landingPageConvRate: 0 
      },
      salesMetrics: { avgResponseTime: 'N/A', totalBilling: 0, generalConvRate: 0 }
    },
    clientInfo: { projectName, totalUnits, vgv: totalVGV, weeksOperation: 1 },
    salesTrend: [],
    funnelData: funnelStages,
    leadsList: leadsList,
    adsTrend: [],
    creativePlayback,
    dataSource: rows.length > 0 ? 'supabase' : 'fallback',
    rawSample: rows,
    fetchedTables,
    rawDataByTable
  };
};

export const fetchData = async (tableNames: string[]): Promise<{ data: DashboardData, error?: string }> => {
  try {
    const allRows: any[] = [];
    const successfulTables: string[] = [];
    const rawDataByTable: Record<string, any[]> = {};

    const results = await Promise.all(tableNames.map(async (table) => {
      const formattedName = table.includes(' ') ? `"${table}"` : table;
      let allTableData: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from(formattedName)
          .select('*')
          .range(from, from + step - 1);

        if (error) return { table, data: null, error };

        if (data && data.length > 0) {
          allTableData = [...allTableData, ...data];
          from += step;
          if (data.length < step) hasMore = false;
        } else {
          hasMore = false;
        }
      }
      return { table, data: allTableData, error: null };
    }));

    results.forEach(({ table, data, error }) => {
      if (!error && data) {
        allRows.push(...data);
        successfulTables.push(table);
        rawDataByTable[table] = data;
      }
    });

    return { data: processSupabaseData(allRows, successfulTables, rawDataByTable) };
  } catch (err: any) {
    return { data: processSupabaseData([], [], {}), error: `Falha na conexão: ${err.message}` };
  }
};
