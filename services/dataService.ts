
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

  // First pass: look for exact matches after normalization
  for (const key of keys) {
    const normalizedSearchKey = normalizeStr(key);
    const found = rowKeys.find(rk => normalizeStr(rk) === normalizedSearchKey);
    if (found && row[found] !== null && row[found] !== "" && row[found] !== undefined) {
      return row[found];
    }
  }

  // Second pass: look for partial matches (as fallback)
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

// Helper to properly capitalize stage names (Title Case)
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
  const dadosTables = fetchedTables.filter(t => t.toLowerCase().includes('dados'));
  const statusTables = fetchedTables.filter(t => t.toLowerCase().includes('status_venda'));

  const marketingRows: any[] = [];
  marketingTables.forEach(t => {
    if (rawDataByTable[t]) marketingRows.push(...rawDataByTable[t]);
  });

  const salesRows: any[] = [];
  salesTables.forEach(t => {
    if (rawDataByTable[t]) salesRows.push(...rawDataByTable[t]);
  });

  const dadosRows: any[] = [];
  dadosTables.forEach(t => {
    if (rawDataByTable[t]) dadosRows.push(...rawDataByTable[t]);
  });

  const statusRows: any[] = [];
  statusTables.forEach(t => {
    if (rawDataByTable[t]) statusRows.push(...rawDataByTable[t]);
  });

  console.log(`[DATA SERVICE] Status tables found: ${statusTables.join(', ')}`);
  console.log(`[DATA SERVICE] Total status rows: ${statusRows.length}`);

  // Create a map for quick status lookup by ID negocio or Name
  const cleanStatusStr = (s: any) => String(s || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

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

    if (idNegocioRaw) {
      statusByIdMap[String(idNegocioRaw).trim()] = info;
    }
    if (nomeRaw) {
      statusByNameMap[normalizeStr(String(nomeRaw))] = info;
    }
  });

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

    const leads = parseNumeric(findValue(row, ["Leads", "lead count", "leads_gerados", "results", "resultados", "leads fb", "leads google"]));
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
    const campaign = findValue(row, ["Campaign", "Campanha", "campaign_name", "Campaign Name"]) || "N/A";
    const adSet = findValue(row, ["Ad Set Name", "Conjunto de Anuncios", "ad_set_name", "adset_name", "Conjunto de anúncios"]) || "N/A";
    const dateValue = findValue(row, ["Date", "Day", "dia", "data", "created_at"]) || "";

    const v3s = parseNumeric(findValue(row, ["3-Second Video Views", "3_sec_video_views", "Video Plays 3s"]));
    const p25 = parseNumeric(findValue(row, ["Video Watches at 25%", "video_p25_watched_actions", "Video P25"]));
    const p50 = parseNumeric(findValue(row, ["Video Watches at 50%", "video_p50_watched_actions", "Video P50"]));
    const p75 = parseNumeric(findValue(row, ["Video Watches at 75%", "video_p75_watched_actions", "Video P75"]));
    const p95 = parseNumeric(findValue(row, ["Video Watches at 95%", "video_p95_watched_actions", "Video P95"]));
    const p100 = parseNumeric(findValue(row, ["Video Watches at 100%", "video_p100_watched_actions", "Video P100"]));

    if (!creativeMap[adName]) {
      creativeMap[adName] = { adName, campaign, adSet, views3s: 0, p25: 0, p50: 0, p75: 0, p95: 0, p100: 0, retentionRate: 0, date: String(dateValue) };
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

    const idNegocioRaw = findValue(row, ["ID negocio", "id_negocio", "deal_id"]);
    const idNegocio = idNegocioRaw ? String(idNegocioRaw).trim() : "";
    const leadNameRaw = findValue(row, ["nome", "name", "cliente", "customer name", "lead"]);
    const leadNameNorm = normalizeStr(String(leadNameRaw || ''));

    // Prioridade total para Status_Venda_2
    const statusInfo = (idNegocio && statusByIdMap[idNegocio]) || (leadNameNorm && statusByNameMap[leadNameNorm]);
    if (statusInfo) statusInfo.handled = true;

    const statusVendaRaw = statusInfo ? statusInfo.status : cleanStatusStr(findValue(row, ["status_venda_2", "Status_Venda_2", "status_venda", "venda_status"]));
    const statusVendaNorm = normalizeStr(statusVendaRaw);

    // Extrair informações de pipeline
    const pipelineIdRaw = findValue(row, ["id pipeline", "ID Pipeline", "id_funil", "ID Funil", "id_pipeline", "pipeline_id", "funil_id"]);
    const pipelineId = pipelineIdRaw ? String(pipelineIdRaw).trim() : "";
    const pipelineNameRaw = findValue(row, ["pipeline", "Pipeline", "funil", "board", "funil_nome", "nome_funil"]);
    const pipelineName = pipelineNameRaw ? String(pipelineNameRaw).trim() : "";

    const leadName = findValue(row, ["nome", "name", "cliente", "customer name", "lead"]);
    const rowQty = parseNumeric(findValue(row, ["quantidade", "qtd", "units_sold", "volume", "unid", "unidades"]));
    const multiplier = rowQty > 0 ? rowQty : 1;

    const rowValRaw = (statusInfo && statusInfo.value > 0) ? statusInfo.value : findValue(row, ["valor", "vaor", "venda", "price", "amount", "valor_venda", "valor_venda_2"]);
    const rowVal = parseNumeric(rowValRaw);

    const isVendaConcluida = stageId === "14" ||
      stageNorm.includes("vendasconcluidas") ||
      stageNorm.includes("vendasconcluida") ||
      stageNorm === "venda concluida" ||
      statusVendaNorm.includes("ganho");

    const isPreAgendamento = stageId === "10" ||
      stageNorm.includes("preagendamento") ||
      stageNorm.includes("pre-agendamento");

    const finalLeadName = String(leadName || findValue(row, ["email", "telefone"]) || "Lead Sem Nome").trim();

    // Get tags if available
    let tags: string[] | undefined;
    const tagsRaw = findValue(row, ["tags", "etiquetas", "labels", "categorias", "tag", "etiqueta", "label", "categoria", "tipo", "type", "classificacao", "classification"]);
    if (tagsRaw) {
      if (Array.isArray(tagsRaw)) {
        tags = tagsRaw.map(t => String(t).trim()).filter(t => t.length > 0 && t.toLowerCase() !== 'sem etiqueta');
      } else if (typeof tagsRaw === 'string') {
        tags = tagsRaw.split(/[,;|]/).map(t => t.trim()).filter(t => t.length > 0 && t.toLowerCase() !== 'sem etiqueta');
      }
    }
    if (tags && tags.length === 0) tags = undefined;

    // LÓGICA RÍGIDA PEDIDA: "Reserva do Sal so vai ser pra quem ta escrito Reserva do Sal e o ID da Pipeline 3"
    // PREVALECE STATUS_VENDA_2: Se vier do statusMap, o pipeline da Status_Venda_2 prevalece (conforme pedido)
    const pipelineNorm = normalizeStr(pipelineName);
    const hasReservaName = pipelineNorm.includes("reserva");
    const hasReservaId = String(pipelineId).trim() === "3";

    let finalPipeline = "High Contorno";
    if (statusInfo && statusInfo.pipeline) {
      const sPipeNorm = normalizeStr(statusInfo.pipeline);
      if (sPipeNorm.includes("reserva")) finalPipeline = "Reserva do Sal";
      else finalPipeline = "High Contorno";
    } else {
      const isReservaSal = hasReservaName && hasReservaId && !statusVendaRaw;
      finalPipeline = isReservaSal ? "Reserva do Sal" : "High Contorno";
    }

    // Determinar estágio final
    const finalStage = isVendaConcluida ? "Vendas Concluidas" : (isPreAgendamento ? "Pre Agendamento" : (stageName || "Sem Etapa"));

    // Pipeline Filter Check
    if (filterPipelines.length === 0 || filterPipelines.some(fp => normalizeStr(fp) === normalizeStr(finalPipeline))) {
      leadsList.push({
        id: `lead-${index}-${Math.random().toString(36).substr(2, 9)}`,
        name: finalLeadName,
        email: String(findValue(row, ["email", "e-mail", "mail"]) || "Sem E-mail"),
        phone: String(findValue(row, ["telefone", "phone", "whatsapp", "celular"]) || "---"),
        businessTitle: String(findValue(row, ["titulo do negocio", "negocio", "deal title", "business"]) || "---"),
        pipeline: finalPipeline,
        stage: finalStage,
        stageId: stageId,
        quantity: multiplier,
        date: String(findValue(row, ["data", "created_at", "date", "dia"]) || "---"),
        tags: tags,
        statusVenda2: statusVendaRaw,
        value: rowVal * multiplier
      });
    }
  });


  // PROCESSAR TODOS OS LEADS DE STATUS_VENDA_2 COM STATUS "GANHO" OU "PERDIDO"
  // Adicionar diretamente em Vendas Concluidas ou Perdido para visualização no dashboard
  statusRows.forEach((sRow, sIdx) => {
    const statusRaw = findValue(sRow, ["status", "venda_status", "status_venda"]);
    const statusCleaned = cleanStatusStr(statusRaw);
    const statusNorm = normalizeStr(statusCleaned);

    // Só processar se for GANHO ou PERDIDO
    const isGanho = statusNorm.includes("ganho");
    const isPerdido = statusNorm.includes("perdido");

    if (!isGanho && !isPerdido) return;

    const nome = findValue(sRow, ["nome", "name", "customer name", "Etiqueta", "titulo do negocio"]) || "Lead Sem Nome";
    const pipelineRaw = findValue(sRow, ["Pipeline", "pipeline", "funil", "board"]) || "";
    const pipelineNorm = normalizeStr(String(pipelineRaw));

    // Determinar estágio final: Se for GANHO vai pra Vendas Concluidas. Se for PERDIDO, busca etapa finalizada.
    let finalStage = "Vendas Concluidas";
    let finalStageId = "14";

    if (isPerdido) {
      const etapaFinalizada = findValue(sRow, ["Etapa finalizada", "etapa_finalizada", "Etapa", "etapa", "fase"]);
      finalStage = etapaFinalizada ? toTitleCase(String(etapaFinalizada)) : "Entrada Do Lead";
      finalStageId = "lost";
    }

    // Determinar pipeline: Reserva do Sal ou High Contorno
    const finalPipeline = pipelineNorm.includes("reserva") ? "Reserva do Sal" : "High Contorno";

    // Verificar filtro de pipeline (se houver filtro selecionado no topo)
    if (filterPipelines.length > 0 && !filterPipelines.some(fp => normalizeStr(fp) === normalizeStr(finalPipeline))) {
      return;
    }

    const valor = parseNumeric(findValue(sRow, ["valor", "vaor", "value", "venda"]));
    const email = String(findValue(sRow, ["email", "e-mail"]) || "---");
    const telefone = String(findValue(sRow, ["telefone", "whatsapp", "phone"]) || "---");
    const tituloNegocio = String(findValue(sRow, ["titulo do negocio", "negocio", "deal title"]) || "---");
    const data = String(findValue(sRow, ["data", "created_at", "date", "dia"]) || "---");

    // Adicionar à lista de leads no estágio correspondente
    leadsList.push({
      id: `status-venda-${isGanho ? 'ganho' : 'perdido'}-${sIdx}-${Math.random().toString(36).substr(2, 9)}`,
      name: String(nome).trim(),
      email: email,
      phone: telefone,
      businessTitle: tituloNegocio,
      pipeline: finalPipeline,
      stage: finalStage,
      stageId: finalStageId,
      quantity: 1,
      date: data,
      statusVenda2: statusCleaned,
      value: valor
    });

    // Atualizar totais de faturamento e contagem de vendas (SÓ PARA GANHO)
    if (isGanho && valor > 0) {
      totalSalesValue += valor;
      countVendasID14 += 1;
    }
  });

  // Processar tabela de valores extras (Novos Ganhos)
  const valoresTables = fetchedTables.filter(t => t.toLowerCase().includes('valores'));
  const valoresRows: any[] = [];
  valoresTables.forEach(t => {
    if (rawDataByTable[t]) valoresRows.push(...rawDataByTable[t]);
  });

  const getDeterministicDate2025 = (name: string, index: number) => {
    const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
    const start = new Date('2025-02-01T00:00:00').getTime();
    const end = new Date('2025-11-30T23:59:59').getTime();
    const range = end - start;
    const pseudoRandom = (Math.sin(seed) + 1) / 2;
    return new Date(start + pseudoRandom * range).toISOString();
  };

  // Reset aggregates for Vendas Concluidas (to be populated from CRM/Valores)
  totalSalesValue = 0;
  countVendasID14 = 0;
  stageCounts["Vendas Concluidas"] = 0;

  // Re-build leadsList to include ONLY necessary concluida leads (Reserva) vs Valores (High Contorno)
  const crmLeads = leadsList.filter(l => {
    const isConcluida = l.stage === "Vendas Concluidas" || l.stageId === "14";
    // Se for Venda Concluída no High Contorno, removemos pois será re-adicionado via valoresRows (Novos Ganhos)
    // EXCETO para leads da Status_Venda_2 que devem ser mantidos se forem órfãos.
    if (isConcluida && l.pipeline === "High Contorno" && !l.id.startsWith('status-orphan')) return false;
    return true;
  });

  leadsList = crmLeads;

  // Add Concluidas from CRM (Reserva) to aggregates
  leadsList.forEach(l => {
    const isConcluida = l.stage === "Vendas Concluidas" || l.stageId === "14";
    if (isConcluida) {
      totalSalesValue += (l.value || 0);
      countVendasID14 += l.quantity;
    }
  });

  valoresRows.forEach((row, vIndex) => {
    const vNomeRaw = findValue(row, ["nome", "cliente"]);
    const vNome = vNomeRaw ? String(vNomeRaw) : "Sem Nome";
    const vNomeNorm = normalizeStr(vNome);

    // Check Status_Venda_2 prevalence for extra values too
    const statusInfo = statusByNameMap[vNomeNorm];
    if (statusInfo) statusInfo.handled = true;

    const vValor = (statusInfo && statusInfo.value > 0) ? statusInfo.value : parseNumeric(findValue(row, ["valor"]));
    const isPerdido = statusInfo && normalizeStr(statusInfo.status).includes("perdido");

    if (vValor > 0 && !isPerdido) {
      const syncDate = getDeterministicDate2025(vNome, vIndex);
      const dateObj = new Date(syncDate);

      let isWithinFilter = true;
      if (filterStartDate && dateObj < new Date(filterStartDate)) isWithinFilter = false;
      if (filterEndDate && dateObj > new Date(filterEndDate)) isWithinFilter = false;

      if (isWithinFilter) {
        let vPipeline = "High Contorno";
        if (statusInfo && statusInfo.pipeline) {
          const sPipeNorm = normalizeStr(statusInfo.pipeline);
          if (sPipeNorm.includes("reserva")) vPipeline = "Reserva do Sal";
        }

        if (filterPipelines.length === 0 || filterPipelines.some(fp => normalizeStr(fp) === normalizeStr(vPipeline))) {
          totalSalesValue += vValor;
          countVendasID14 += 1;
          leadsList.push({
            id: `valor-${vIndex}-${Math.random().toString(36).substr(2, 9)}`,
            name: vNome,
            email: "---",
            phone: "---",
            businessTitle: vNome,
            pipeline: vPipeline,
            stage: "Vendas Concluidas",
            stageId: "14",
            quantity: 1,
            date: syncDate,
            statusVenda2: statusInfo ? statusInfo.status : "ganho",
            value: vValor
          });
        }
      }
    }
  });

  // Recalculate stageCounts
  leadsList.forEach(l => {
    const stageNorm = normalizeStr(l.stage);
    let matchedStage: string | undefined;

    if (l.stage === "Vendas Concluidas") {
      matchedStage = "vendas concluidas";
    } else if (l.stage === "Pre Agendamento") {
      matchedStage = "pre agendamento";
    } else {
      matchedStage = PREFERRED_ORDER.find(term => stageNorm.includes(normalizeStr(term)));
      if (!matchedStage) {
        if (stageNorm.includes("reuniaomarcada") || (stageNorm.includes("reuniao") && stageNorm.includes("marcad"))) {
          matchedStage = "reuniao agendada";
        } else if (stageNorm.includes("contato") || stageNorm.includes("mensagem") || stageNorm.includes("abordagem")) {
          if (stageNorm.includes("inicial") || stageNorm.includes("primeira") || stageNorm.includes("mensagem")) {
            matchedStage = "mensagem inicial";
          } else {
            matchedStage = "tentativa de contato";
          }
        } else if (stageNorm.includes("novo") || stageNorm.includes("leads") || stageNorm.includes("entrada") || stageNorm.includes("recebid")) {
          matchedStage = "entrada do lead";
        }
      }
    }

    if (matchedStage) {
      const officialName = toTitleCase(matchedStage);
      stageCounts[officialName] = (stageCounts[officialName] || 0) + 1;
    } else if (l.stage && l.stage !== "Sem Etapa") {
      stageCounts["Entrada Do Lead"] = (stageCounts["Entrada Do Lead"] || 0) + 1;
    }
  });

  const realTotalLeads = leadsList.length;
  const hasMarketingData = marketingRows.length > 0;
  const leadsForMarketingCalculations = hasMarketingData ? totalMarketingLeads : realTotalLeads;

  const averageCPL = leadsForMarketingCalculations > 0 ? totalSpend / leadsForMarketingCalculations : 0;
  const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const averageCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const averageFreq = countFreqRows > 0 ? sumFreq / countFreqRows : 1;

  const funnelStages: FunnelStage[] = PREFERRED_ORDER.map(term => {
    const officialName = toTitleCase(term);
    const count = stageCounts[officialName] || 0;
    const stageLeads = leadsList.filter(lead => {
      const leadStageNorm = normalizeStr(lead.stage);
      const termNorm = normalizeStr(term);
      return leadStageNorm.includes(termNorm) || normalizeStr(officialName).includes(leadStageNorm);
    });
    const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    return {
      stage: officialName,
      count: count,
      color: generateColor(term),
      value: stageValue
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
      cac: averageCPL,
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
        leads: leadsForMarketingCalculations,
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
