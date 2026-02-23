
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
    const found = rowKeys.find(rk => normalizeStr(rk) === normalizedSearchKey);
    if (found && row[found] !== null && row[found] !== "" && row[found] !== undefined) {
      return row[found];
    }
  }

  for (const key of keys) {
    const normalizedSearchKey = normalizeStr(key);
    const found = rowKeys.find(rk => normalizeStr(rk).includes(normalizedSearchKey));
    if (found && row[found] !== null && row[found] !== "" && row[found] !== undefined) {
      return row[found];
    }
  }
  return null;
};

const PREFERRED_ORDER = [
  "entrada do lead",
  "mensagem inicial",
  "tentativa de contato",
  "em atendimento",
  "qualificado",
  "lead futuro",
  "pre agendamento",
  "reuniao agendada",
  "reuniao realizada",
  "proposta enviada",
  "vendas concluidas"
];

const generateColor = (name: string): string => {
  const n = normalizeStr(name);
  if (n.includes("venda") || n.includes("concluid") || n.includes("ganho")) return '#10b981';
  if (n.includes("perdido")) return '#ef4444';
  const idx = PREFERRED_ORDER.findIndex(term => n.includes(normalizeStr(term)));
  if (idx === -1) return '#94a3b8';
  return `hsl(214, 66%, ${Math.max(25, 85 - (idx * (50 / PREFERRED_ORDER.length)))}%)`;
};

const toTitleCase = (str: string): string => {
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

export const processSupabaseData = (rows: any[], fetchedTables: string[] = [], rawDataByTable: Record<string, any[]> = {}, filterStartDate?: string, filterEndDate?: string, filterPipelines: string[] = []): DashboardData => {
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
    const officialName = toTitleCase(stage);
    stageCounts[officialName] = 0;
  });

  let leadsList: ClientLead[] = [];
  const creativeMap: Record<string, CreativePlayback> = {};

  let sumFreq = 0;
  let countFreqRows = 0;

  const marketingTables = fetchedTables.filter(t => t.toLowerCase().includes('marketing'));
  const salesTables = fetchedTables.filter(t => t.toLowerCase().includes('venda') && !t.toLowerCase().includes('status'));
  const statusTables = fetchedTables.filter(t => t.toLowerCase().includes('status_venda'));

  const marketingRows: any[] = [];
  marketingTables.forEach(t => {
    if (rawDataByTable[t]) marketingRows.push(...rawDataByTable[t]);
  });

  const salesRows: any[] = [];
  salesTables.forEach(t => {
    if (rawDataByTable[t]) {
      rawDataByTable[t].forEach(r => salesRows.push({ ...r, __tableName: t }));
    }
  });

  const statusRows: any[] = [];
  statusTables.forEach(t => {
    if (rawDataByTable[t]) statusRows.push(...rawDataByTable[t]);
  });

  const cleanStatusStr = (s: any) => String(s || '').replace(/[\u0300-\u036f\u1f600-\u1f64f]/gu, '').trim();

  interface StatusInfo {
    status: string;
    pipeline: string;
    value: number;
    raw: any;
    name: string;
    date: string;
    handled?: boolean;
  }

  const statusByIdMap: Record<string, StatusInfo> = {};
  const statusByNameMap: Record<string, StatusInfo> = {};

  statusRows.forEach(row => {
    const idNegocioRaw = findValue(row, ["ID negocio", "id_negocio", "deal_id"]);
    const nomeRaw = findValue(row, ["nome", "name", "customer name", "Etiqueta", "titulo do negocio"]);
    const statusVal = findValue(row, ["status", "venda_status", "status_venda"]);
    const pipelineVal = findValue(row, ["Pipeline", "pipeline", "funil", "board"]);
    const valorVal = findValue(row, ["valor", "vaor", "value", "venda"]);
    const dateVal = findValue(row, ["data", "created_at", "date", "dia"]) || "";

    const info: StatusInfo = {
      status: cleanStatusStr(statusVal),
      pipeline: String(pipelineVal || '').trim(),
      value: parseNumeric(valorVal),
      name: String(nomeRaw || '').trim(),
      date: String(dateVal),
      raw: row
    };

    if (idNegocioRaw) statusByIdMap[String(idNegocioRaw).trim()] = info;
    if (nomeRaw) statusByNameMap[normalizeStr(String(nomeRaw))] = info;
  });

  marketingRows.forEach((row) => {
    let isWithinDateFilter = true;
    if (filterStartDate || filterEndDate) {
      const rowDateRaw = row.Date || row.Day || row.dia || row.data || row.created_at;
      if (rowDateRaw) {
        let dateStr = String(rowDateRaw);
        if (dateStr.includes('/') && dateStr.split('/').length === 3) {
          const [day, month, year] = dateStr.split('/');
          dateStr = `${year}-${month}-${day}`;
        }
        const rowDate = new Date(dateStr);
        if (!isNaN(rowDate.getTime())) {
          if (filterStartDate) {
            const start = new Date(filterStartDate + "T00:00:00");
            if (rowDate < start) isWithinDateFilter = false;
          }
          if (filterEndDate) {
            const end = new Date(filterEndDate + "T23:59:59");
            if (rowDate > end) isWithinDateFilter = false;
          }
        }
      }
    }

    if (isWithinDateFilter) {
      totalSpend += parseNumeric(findValue(row, ["Amount Spent", "investimento", "valor gasto", "custo", "gastos", "spent"]));
      totalMarketingLeads += parseNumeric(findValue(row, ["Leads", "lead count", "leads_gerados", "results", "resultados", "leads fb", "leads google"]));
      totalReach += parseNumeric(findValue(row, ["Reach", "Alcance"]));
      totalImpressions += parseNumeric(findValue(row, ["Impressions", "Impressoes"]));
      totalClicks += parseNumeric(findValue(row, ["Link Clicks", "Cliques", "Clicks"]));

      const freq = parseNumeric(findValue(row, ["Frequency", "Frequencia", "frequency_score"]));
      if (freq > 0) {
        sumFreq += freq;
        countFreqRows++;
      }
    }

    const adName = findValue(row, ["Ad Name", "Nome do Anuncio", "Anuncio", "ad_name", "Anúncio"]) || "Sem Nome";
    if (!creativeMap[adName]) {
      creativeMap[adName] = {
        adName,
        campaign: String(findValue(row, ["Campaign"]) || "N/A"),
        adSet: String(findValue(row, ["Ad Set Name"]) || "N/A"),
        views3s: 0, p25: 0, p50: 0, p75: 0, p95: 0, p100: 0, retentionRate: 0,
        date: String(findValue(row, ["Date"]) || "")
      };
    }
    creativeMap[adName].views3s += parseNumeric(findValue(row, ["3-Second Video Views"]));
    creativeMap[adName].p100 += parseNumeric(findValue(row, ["Video Watches at 100%"]));
  });

  const creativePlayback: CreativePlayback[] = Object.values(creativeMap)
    .map(c => ({ ...c, retentionRate: c.views3s > 0 ? (c.p100 / c.views3s) * 100 : 0 }))
    .sort((a, b) => b.p100 - a.p100);

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const isDateToday = (dStr: string) => {
    if (!dStr || dStr === "---") return false;
    let s = dStr.trim();
    if (s.includes('/') && s.split('/').length === 3) {
      const [d, m, y] = s.split('/');
      s = `${y}-${m}-${d}`;
    }
    if (s.includes('T')) s = s.split('T')[0];
    return s === todayStr;
  };

  salesRows.forEach((row, index) => {
    const stageName = String(findValue(row, ["Nome Etapa", "Status", "etapa", "fase"]) || "").trim();
    const stageId = String(findValue(row, ["ID Etapa", "Etapa ID", "id_etapa"]) || "").trim();
    const idNegocio = String(findValue(row, ["ID negocio", "id_negocio"]) || "").trim();
    const leadNameNorm = normalizeStr(String(findValue(row, ["nome", "name"]) || ''));

    const statusInfo = (idNegocio && statusByIdMap[idNegocio]) || (leadNameNorm && statusByNameMap[leadNameNorm]);
    if (statusInfo) statusInfo.handled = true;

    const statusVendaRaw = (() => {
      const updatedValue = findValue(row, ["atualizado?", "atualizado", "Atualizado", "atualizacao", "atualização"]);
      const uStr = updatedValue ? String(updatedValue).trim() : "";
      const uNorm = normalizeStr(uStr);
      const crmStatus = statusInfo ? normalizeStr(statusInfo.status || "") : "";

      if (crmStatus.includes("ganho") || crmStatus.includes("vendido") || uNorm.includes("vendido")) return "ganho";

      const createdVal = String(findValue(row, ["data", "created_at", "date", "dia"]) || "");
      if (isDateToday(uStr) || isDateToday(createdVal)) {
        if (crmStatus.includes("perdido") || uNorm.includes("perdido")) return "perdido";
        return "atual";
      }
      return "perdido";
    })();

    const pipelineId = String(findValue(row, ["id pipeline", "ID Pipeline"]) || "").trim();
    const pipelineName = String(findValue(row, ["pipeline", "Pipeline"]) || "").trim();
    let finalPipeline = "High Contorno";
    if (statusInfo && statusInfo.pipeline) {
      finalPipeline = normalizeStr(statusInfo.pipeline).includes("reserva") ? "Reserva do Sal" : "High Contorno";
    } else {
      finalPipeline = (normalizeStr(pipelineName).includes("reserva") && pipelineId === "3") ? "Reserva do Sal" : "High Contorno";
    }

    if (filterPipelines.length === 0 || filterPipelines.some(fp => normalizeStr(fp) === normalizeStr(finalPipeline))) {
      leadsList.push({
        id: `lead-${index}-${Math.random().toString(36).substr(2, 9)}`,
        name: String(findValue(row, ["nome", "name"]) || "Lead Sem Nome"),
        email: String(findValue(row, ["email"]) || "---"),
        phone: String(findValue(row, ["telefone"]) || "---"),
        businessTitle: String(findValue(row, ["titulo do negocio"]) || "---"),
        pipeline: finalPipeline,
        stage: stageName,
        stageId: statusVendaRaw.includes('perdido') ? "lost" : stageId,
        quantity: 1,
        date: String(findValue(row, ["data"]) || "---"),
        statusVenda2: statusVendaRaw,
        value: parseNumeric(findValue(row, ["valor"]))
      });
    }
  });

  statusRows.forEach((sRow, sIdx) => {
    const statusNorm = normalizeStr(cleanStatusStr(findValue(sRow, ["status", "venda_status"])));
    if (!statusNorm.includes("ganho") && !statusNorm.includes("perdido")) return;

    const entryDate = String(findValue(sRow, ["data"]) || "---");
    const isPerdido = statusNorm.includes("perdido");

    let effectiveStatus = statusNorm.includes("ganho") ? "ganho" : "perdido";
    if (isPerdido && isDateToday(entryDate)) effectiveStatus = "atual";

    const pipelineNorm = normalizeStr(String(findValue(sRow, ["Pipeline"]) || ""));
    const finalPipeline = pipelineNorm.includes("reserva") ? "Reserva do Sal" : "High Contorno";

    if (filterPipelines.length === 0 || filterPipelines.some(fp => normalizeStr(fp) === normalizeStr(finalPipeline))) {
      leadsList.push({
        id: `status-${sIdx}-${Math.random().toString(36).substr(2, 9)}`,
        name: String(findValue(sRow, ["nome"]) || "Lead Sem Nome"),
        email: "---", phone: "---", businessTitle: "---",
        pipeline: finalPipeline,
        stage: isPerdido ? "Entrada Do Lead" : "Vendas Concluidas",
        stageId: isPerdido ? "lost" : "14",
        quantity: 1,
        date: entryDate,
        statusVenda2: effectiveStatus,
        value: parseNumeric(findValue(sRow, ["valor"]))
      });
    }
  });

  totalSalesValue = 0;
  countVendasID14 = 0;
  leadsList.forEach(l => {
    if (l.statusVenda2 === "ganho") {
      totalSalesValue += l.value;
      countVendasID14 += 1;
    }
    const stageNorm = normalizeStr(l.stage);
    let matchedStage = PREFERRED_ORDER.find(term => stageNorm.includes(normalizeStr(term)));
    if (matchedStage) {
      const officialName = toTitleCase(matchedStage);
      if (l.statusVenda2 !== "perdido" || matchedStage.includes("concluid")) {
        stageCounts[officialName] = (stageCounts[officialName] || 0) + 1;
      }
    }
  });

  const funnelStages: FunnelStage[] = PREFERRED_ORDER.map(term => {
    const officialName = toTitleCase(term);
    const stageLeads = leadsList.filter(lead => {
      const match = normalizeStr(lead.stage).includes(normalizeStr(term));
      return match && (lead.statusVenda2 !== "perdido" || term.includes("concluid"));
    });
    return {
      stage: officialName,
      count: stageCounts[officialName] || 0,
      color: generateColor(term),
      value: stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
    };
  });

  return {
    metrics: {
      totalRevenue: totalSalesValue,
      totalUnitsSold: countVendasID14,
      totalLeads: leadsList.length,
      totalSpend,
      marketingMetrics: {
        cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        frequency: countFreqRows > 0 ? sumFreq / countFreqRows : 1,
        cpl: totalMarketingLeads > 0 ? totalSpend / totalMarketingLeads : 0,
        reach: totalReach, impressions: totalImpressions, clicks: totalClicks, leads: totalMarketingLeads, landingPageConvRate: 0
      },
      salesMetrics: { avgResponseTime: 'N/A', totalBilling: 0, generalConvRate: 0 },
      revenuePerUnitManaged: 0, unitsSoldPerWeek: 0, preLaunchSoldRatio: 0, conversionRateLeadToSale: 0, qualifiedLeadRatio: 0, cac: 0
    },
    clientInfo: { projectName, totalUnits, vgv: totalVGV, weeksOperation: 1 },
    salesTrend: [], funnelData: funnelStages, leadsList, adsTrend: [], creativePlayback,
    dataSource: 'supabase', rawSample: rows, fetchedTables, rawDataByTable
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
        const { data, error } = await supabase.from(formattedName).select('*').range(from, from + step - 1);
        if (error) return { table, data: null, error };
        if (data && data.length > 0) {
          allTableData = [...allTableData, ...data];
          from += step;
          if (data.length < step) hasMore = false;
        } else hasMore = false;
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
