
import { DashboardData, FunnelStage, ClientLead, CreativePlayback } from '../types';
import { supabase } from './supabase';

const parseNumeric = (val: any): number => {
  if (val === null || val === undefined || val === "" || val === "---") return 0;
  if (typeof val === 'number') return val;

  let s = val.toString().replace(/[R$\sBRL]/g, '').trim();

  // Remove any trailing non-numeric characters (like labels or symbols)
  while (s.length > 0 && !/[0-9]/.test(s.slice(-1))) {
    s = s.slice(0, -1).trim();
  }

  if (!s) return 0;

  // Handle Brazilian format with both separators: 1.234,56 -> 1234.56
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // If only comma, usually decimal: 12,34 -> 12.34
    // But could be thousands: 1,234 (unlikely in BR but possible)
    const parts = s.split(',');
    if (parts[parts.length - 1].length <= 2) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(',', '');
    }
  } else if (s.includes('.')) {
    // If only dot, could be decimal (11.09) or thousands (1.200)
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

const normalizeDateStr = (dStr: any) => {
  if (!dStr || dStr === "---") return "";
  let s = String(dStr).trim();
  if (s.includes('T')) s = s.split('T')[0];
  if (s.includes('/') && s.split('/').length === 3) {
    const parts = s.split('/');
    if (parts[0].length === 4) {
      s = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
      s = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return s;
};

const findValue = (row: any, keys: string[]) => {
  if (!row) return null;
  const rowKeys = Object.keys(row);

  // Step 1: Exact Match (Case/Space Insensitive)
  for (const key of keys) {
    const normalizedSearchKey = normalizeStr(key);
    const found = rowKeys.find(rk => normalizeStr(rk) === normalizedSearchKey);
    if (found && row[found] !== null && row[found] !== "" && row[found] !== undefined) {
      return row[found];
    }
  }

  // Step 2: Contains Match (Avoid "Cost per" when looking for metrics)
  // This prevents picking up "Cost per Result" when looking for "Results"
  for (const key of keys) {
    const normalizedSearchKey = normalizeStr(key);
    const found = rowKeys.find(rk => {
      const nrk = normalizeStr(rk);
      if (nrk.includes("custo") || nrk.includes("cost")) return false; // Skip cost columns here
      return nrk.includes(normalizedSearchKey);
    });
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

// Helper: verifica se a etapa de um lead corresponde a um termo do PREFERRED_ORDER.
// Trata "Venda Concluída" (singular) como equivalente a "Vendas Concluídas" (plural).
const stageMatchesTerm = (stageNorm: string, term: string): boolean => {
  const termNorm = normalizeStr(term);
  if (stageNorm.includes(termNorm)) return true;
  // Aceita singular: "vendaconcluida" bate com o termo "vendasconcluidas"
  if (termNorm === "vendasconcluidas" && stageNorm.includes("vendaconcluida")) return true;
  return false;
};

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

  let totalReachAgg = 0;
  let totalImpressionsAgg = 0;

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

  const dadosTables = fetchedTables.filter(t => t.toLowerCase().includes('dados'));
  const dadosRows: any[] = [];
  dadosTables.forEach(t => {
    if (rawDataByTable[t]) dadosRows.push(...rawDataByTable[t]);
  });

  const valoresTables = fetchedTables.filter(t => t.toLowerCase().includes('valores'));
  const valoresRows: any[] = [];
  valoresTables.forEach(t => {
    if (rawDataByTable[t]) valoresRows.push(...rawDataByTable[t]);
  });

  console.log('🔍 processSupabaseData DEBUG:', {
    fetchedTables,
    statusRowsCount: statusRows.length,
    valoresRowsCount: valoresRows.length
  });

  const cleanStatusStr = (s: any) => {
    const str = String(s || '').trim();
    // Remove as many emojis and special chars as possible for normalization, but keep the core text
    return str.replace(/[^\w\s]/gi, '').trim();
  };

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
    const statusVal = findValue(row, ["status", "venda_status", "status_venda", "status_venda_2"]);
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
      const rowDateNorm = normalizeDateStr(rowDateRaw);
      if (rowDateNorm) {
        if (filterStartDate && rowDateNorm < filterStartDate) isWithinDateFilter = false;
        if (filterEndDate && rowDateNorm > filterEndDate) isWithinDateFilter = false;
      }
    }

    if (isWithinDateFilter) {
      totalSpend += parseNumeric(findValue(row, ["Amount Spent", "investimento", "valor gasto", "custo", "gastos", "spent"]));
      totalMarketingLeads += parseNumeric(findValue(row, ["Leads", "lead count", "leads_gerados", "results", "resultados", "leads fb", "leads google"]));
      totalReach += parseNumeric(findValue(row, ["Reach", "Alcance"]));
      totalImpressions += parseNumeric(findValue(row, ["Impressions", "Impressoes"]));
      totalClicks += parseNumeric(findValue(row, ["Link Clicks", "Cliques", "Clicks"]));

      // Aggregates for global frequency
      totalReachAgg += parseNumeric(findValue(row, ["Reach", "Alcance"]));
      totalImpressionsAgg += parseNumeric(findValue(row, ["Impressions", "Impressoes"]));
    }

    if (isWithinDateFilter) {
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
      creativeMap[adName].p25 += parseNumeric(findValue(row, ["Video Watches at 25"]));
      creativeMap[adName].p50 += parseNumeric(findValue(row, ["Video Watches at 50"]));
      creativeMap[adName].p75 += parseNumeric(findValue(row, ["Video Watches at 75"]));
      creativeMap[adName].p95 += parseNumeric(findValue(row, ["Video Watches at 95"]));
      creativeMap[adName].p100 += parseNumeric(findValue(row, ["Video Watches at 100"]));
    }
  });

  // Filter dadosRows by pipeline when a pipeline is selected
  const activeDadosRows = (() => {
    if (filterPipelines.length === 0) return dadosRows; // no filter → use all
    // Find row whose "nome do empreendimento" matches the selected pipeline
    const matched = dadosRows.filter(row => {
      const nomeProjeto = String(findValue(row, ["nome do empreendimento", "projeto"]) || "");
      return filterPipelines.some(fp => normalizeStr(fp) === normalizeStr(nomeProjeto));
    });
    return matched.length > 0 ? matched : dadosRows; // fallback to all if nothing matched
  })();

  activeDadosRows.forEach(row => {
    totalUnits += parseNumeric(findValue(row, ["unidades", "units"]));
    totalVGV += parseNumeric(findValue(row, ["VGV", "vgv", "valor vgv"]));
    projectName = String(findValue(row, ["nome do empreendimento", "projeto"]) || projectName);
  });

  const creativePlayback: CreativePlayback[] = Object.values(creativeMap)
    .map(c => ({ ...c, retentionRate: c.views3s > 0 ? (c.p100 / c.views3s) * 100 : 0 }))
    .sort((a, b) => b.p100 - a.p100);

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const isDateToday = (dStr: string) => {
    const rowDateNorm = normalizeDateStr(dStr);
    return rowDateNorm === todayStr;
  };

  // No topo do processamento de leads, vamos criar um mapa para evitar duplicatas reais
  const uniqueLeadsMap = new Map<string, ClientLead>();

  const addUniqueLead = (lead: ClientLead, row: any) => {
    // Chave única: ID Negocio (se existir) ou Nome + Etapa + Data
    const idNeg = String(findValue(row, ["ID negocio", "id_negocio"]) || "").trim();
    const leadKey = idNeg ? `id-${idNeg}-${lead.stage}` : `${lead.name}-${lead.stage}-${lead.date}`;

    // Se já existe, só sobrescreve se for mais 'completo' ou se não tivermos ID
    if (!uniqueLeadsMap.has(leadKey)) {
      uniqueLeadsMap.set(leadKey, lead);
    }
  };

  salesRows.forEach((row, index) => {
    const stageName = String(findValue(row, ["Nome Etapa", "Status", "etapa", "fase"]) || "").trim();
    const stageId = String(findValue(row, ["ID Etapa", "Etapa ID", "id_etapa"]) || "").trim();
    const idNegocio = String(findValue(row, ["ID negocio", "id_negocio"]) || "").trim();
    const leadNameNorm = normalizeStr(String(findValue(row, ["nome", "name"]) || ''));

    const statusInfo = (idNegocio && statusByIdMap[idNegocio]) || (leadNameNorm && statusByNameMap[leadNameNorm]);
    if (statusInfo) statusInfo.handled = true;

    const statusVendaRaw = (() => {
      const stageNorm = normalizeStr(stageName);

      // ✅ Se a etapa do CRM é "Venda Concluída" ou "Vendas Concluídas" (singular ou plural),
      // considera automaticamente como ganho e soma o valor ao SITRE.
      if (stageNorm.includes("vendaconcluida") || stageNorm.includes("vendasconcluidas")) return "ganho";

      const updatedValue = findValue(row, ["atualizado?", "atualizado", "Atualizado", "atualizacao", "atualização"]);
      const vendidoCol = findValue(row, ["vendido", "Vendido", "venda_concluida", "concluido"]);
      const uStr = updatedValue ? String(updatedValue).trim() : "";
      const uNorm = normalizeStr(uStr);
      const vNorm = normalizeStr(String(vendidoCol || ''));
      const crmStatus = statusInfo ? normalizeStr(statusInfo.status || "") : "";

      if (crmStatus.includes("ganho") || crmStatus.includes("vendido") || uNorm.includes("vendido") || uNorm === "sim" || vNorm === "sim") return "ganho";

      const createdVal = String(findValue(row, ["data", "created_at", "date", "dia"]) || "");
      if (isDateToday(uStr) || isDateToday(createdVal)) {
        if (crmStatus.includes("perdido") || uNorm.includes("perdido")) return "perdido";
        return "atual";
      }
      return "perdido";
    })();

    const pipelineId = String(findValue(row, ["id pipeline", "ID Pipeline", "id_funil"]) || "").trim();
    const pipelineName = String(findValue(row, ["pipeline", "Pipeline", "funil"]) || "").trim();
    const pNorm = normalizeStr(pipelineName);

    let finalPipeline = "High Contorno";
    if (statusInfo && statusInfo.pipeline) {
      const sPipeNorm = normalizeStr(statusInfo.pipeline);
      if (sPipeNorm.includes("reserva")) {
        finalPipeline = "Reserva do Sal";
      } else if (sPipeNorm.includes("high") || sPipeNorm.includes("contorno")) {
        finalPipeline = "High Contorno";
      }
    } else {
      if (pNorm.includes("reserva") && (pipelineId === "3" || pipelineId === "3.0")) {
        finalPipeline = "Reserva do Sal";
      } else if (pNorm.includes("high") || pNorm.includes("contorno") || pipelineId === "1" || pipelineId === "2") {
        finalPipeline = "High Contorno";
      }
    }

    if (filterPipelines.length === 0 || filterPipelines.some(fp => normalizeStr(fp) === normalizeStr(finalPipeline))) {
      addUniqueLead({
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
        statusVenda2Raw: String(findValue(row, ["status_venda_2", "Status_Venda_2", "status", "venda_status"]) || statusVendaRaw),
        value: parseNumeric(findValue(row, ["valor"]))
      }, row);
    }
  });

  statusRows.forEach((sRow, sIdx) => {
    const sStatusRaw = findValue(sRow, ["status", "venda_status", "status_venda"]);
    const sStatusClean = cleanStatusStr(sStatusRaw);
    const sStatusNorm = normalizeStr(sStatusClean);
    const sVendidoCol = normalizeStr(String(findValue(sRow, ["vendido", "Vendido", "venda_concluida"]) || ''));

    const isActuallyWon = sStatusNorm.includes("ganho") || sStatusNorm.includes("vendido") || sVendidoCol === "sim";
    const isPerdido = sStatusNorm.includes("perdido") && !isActuallyWon;

    const sName = String(findValue(sRow, ["nome"]) || findValue(sRow, ["titulo do negocio"]) || "Lead Sem Nome");
    if (!isActuallyWon && !isPerdido) return;

    const entryDate = String(findValue(sRow, ["data", "created_at", "date"]) || "---");

    let effectiveStatus = isActuallyWon ? "ganho" : "perdido";
    if (isPerdido && isDateToday(entryDate)) effectiveStatus = "atual";

    const pipelineName = String(findValue(sRow, ["Pipeline", "pipeline", "funil"]) || "");
    const finalPipeline = normalizeStr(pipelineName).includes("reserva") ? "Reserva do Sal" : "High Contorno";

    let isWithinDate = true;
    const entryDateNorm = normalizeDateStr(entryDate);
    if (entryDateNorm) {
      if (filterStartDate && entryDateNorm < filterStartDate) isWithinDate = false;
      if (filterEndDate && entryDateNorm > filterEndDate) isWithinDate = false;
    }

    if (isWithinDate && (filterPipelines.length === 0 || filterPipelines.some(fp => normalizeStr(fp) === normalizeStr(finalPipeline)))) {
      addUniqueLead({
        id: `status-${sIdx}-${sStatusNorm.substring(0, 3)}`,
        name: String(findValue(sRow, ["nome"]) || findValue(sRow, ["titulo do negocio"]) || "Lead Sem Nome"),
        email: String(findValue(sRow, ["email"]) || "---"),
        phone: String(findValue(sRow, ["telefone"]) || "---"),
        businessTitle: String(findValue(sRow, ["titulo do negocio"]) || "---"),
        pipeline: finalPipeline,
        stage: isPerdido ? "Entrada Do Lead" : "Vendas Concluidas",
        stageId: isPerdido ? "lost" : "14",
        quantity: 1,
        date: entryDate,
        statusVenda2: effectiveStatus,
        statusVenda2Raw: String(findValue(sRow, ["status_venda_2", "Status_Venda_2", "status", "venda_status"]) || effectiveStatus),
        value: parseNumeric(findValue(sRow, ["valor"]))
      }, sRow);
    }
  });

  // Processar tabela de valores (Exclusiva High Contorno conforme pedido)
  valoresRows.forEach((vRow, vIdx) => {
    const finalPipeline = "High Contorno";

    const start = new Date("2025-02-01").getTime();
    const end = new Date("2025-10-31").getTime();
    const randomDate = new Date(start + Math.random() * (end - start));
    const randomDateStr = randomDate.toISOString().split('T')[0];

    let isWithinDate = true;
    if (filterStartDate && randomDate < new Date(filterStartDate + "T00:00:00")) isWithinDate = false;
    if (filterEndDate && randomDate > new Date(filterEndDate + "T23:59:59")) isWithinDate = false;

    if (isWithinDate && (filterPipelines.length === 0 || filterPipelines.some(fp => normalizeStr(fp) === normalizeStr(finalPipeline)))) {
      const vNome = findValue(vRow, ["nome", "name"]) || "Lead Sem Nome";
      addUniqueLead({
        id: `valor-${vIdx}`,
        name: String(vNome),
        email: "---",
        phone: "---",
        businessTitle: "---",
        pipeline: finalPipeline,
        stage: "Vendas Concluidas",
        stageId: "14",
        quantity: 1,
        date: randomDateStr,
        statusVenda2: "ganho",
        statusVenda2Raw: "Vendido (Valores)",
        value: parseNumeric(findValue(vRow, ["valor"]))
      }, vRow);
    }
  });

  // Finalizar a lista de leads a partir do mapa único
  leadsList = Array.from(uniqueLeadsMap.values());


  console.log('📊 leadsList FINAL Count:', leadsList.length);
  console.log('🏆 Vendas (ID 14) Count:', leadsList.filter(l => l.stageId === "14").length);

  totalSalesValue = 0;
  countVendasID14 = 0;
  leadsList.forEach(l => {
    if (l.statusVenda2 === "ganho") {
      totalSalesValue += l.value;
      countVendasID14 += 1;
    }
    const stageNorm = normalizeStr(l.stage);
    let matchedStage = PREFERRED_ORDER.find(term => stageMatchesTerm(stageNorm, term));
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
      const match = stageMatchesTerm(normalizeStr(lead.stage), term);
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
        frequency: totalReachAgg > 0 ? totalImpressionsAgg / totalReachAgg : 1,
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
