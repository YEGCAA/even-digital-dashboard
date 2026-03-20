
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const normalizeStr = (s) => String(s || '').toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]/g, '');

async function checkDiney() {
    console.log('=== DIAGNÓSTICO COMPLETO: DINEY AZEVEDO ===\n');

    const { data: sales2 } = await supabase.from('Vendas_2').select('*');
    const { data: status2 } = await supabase.from('Status_venda_2').select('*');
    
    let valores2Data = [];
    try {
        const { data } = await supabase.from('valores_2').select('*');
        valores2Data = data || [];
    } catch (e) { /* tabela pode não existir */ }

    // Monta maps de status
    const statusByIdMap = {};
    const statusByNameMap = {};
    (status2 || []).forEach(row => {
        const idNeg = String(row['id_negocio'] || row['ID negocio'] || '').trim();
        const name = String(row.nome || row.name || '').trim();
        const statusVal = row.status || row.venda_status || row.status_venda || row.status_venda_2;
        const valorVal = row.valor || row.vaor || row.value || row.venda;
        const info = { status: statusVal, name, valor: valorVal, raw: row };
        if (idNeg) statusByIdMap[idNeg] = info;
        if (name) statusByNameMap[normalizeStr(name)] = info;
    });

    // ==== 1. DINEY em Vendas_2 ====
    console.log('--- REGISTROS DE DINEY em Vendas_2 ---');
    const dineyInSales = (sales2 || []).filter(row => {
        const allVals = Object.values(row).join(' ');
        return normalizeStr(allVals).includes('diney') || normalizeStr(allVals).includes('azevedo');
    });

    if (dineyInSales.length > 0) {
        dineyInSales.forEach((row, i) => {
            const idNeg = String(row['id_negocio'] || row['ID negocio'] || '').trim();
            const name = row.nome || row.name;
            const stageName = row.nome_etapa || row.Status || row.etapa || '';
            const atu = row['atualizado?'] || row.atualizado;
            const valor = row.valor;
            const statusInfo = (idNeg && statusByIdMap[idNeg]) || statusByNameMap[normalizeStr(String(name || ''))];
            
            const atuStr = String(atu || '').trim();
            const atuNorm = normalizeStr(atuStr);
            const crmStatus = statusInfo ? normalizeStr(String(statusInfo.status || '')) : '';

            // Lógica EXATA do dataService.ts
            let derivedStatus;
            if (crmStatus.includes('ganho') || crmStatus.includes('vendido') || atuNorm.includes('vendido') || atuNorm === 'sim') {
                derivedStatus = 'ganho ✅';
            } else if (atuNorm.includes('perdido')) {
                derivedStatus = 'perdido ❌';
            } else {
                // É uma data? Verifica se é hoje
                // Se não é nem "vendido" nem "perdido", a lógica verifica se é data de hoje
                // Mas como atualizado? é "20/03/2026" e hoje é 20/03/2026, deveria ser "atual"
                // Porém a lógica no dataService.ts analisa o campo como se fosse valor textual
                derivedStatus = `atual (deve aparecer no dashboard) — atu="${atu}"`;
            }

            console.log(`\n[Registro ${i + 1}]`);
            console.log(`  Nome: ${name}`);
            console.log(`  ID Negócio: ${idNeg}`);
            console.log(`  Etapa (nome_etapa): "${stageName}"`);
            console.log(`  ID Etapa (id_etapa): ${row.id_etapa}`);
            console.log(`  Valor em Vendas_2: R$ ${Number(valor || 0).toLocaleString('pt-BR')}`);
            console.log(`  Atualizado?: "${atu}"`);
            console.log(`  normalizeStr("${atu}" ) = "${atuNorm}"`);
            console.log(`  CRM Status (Status_venda_2): ${statusInfo ? `"${statusInfo.status}"` : '❌ NÃO ENCONTRADO NO STATUS_VENDA_2'}`);
            console.log(`  Valor no Status_venda_2: ${statusInfo ? `R$ ${Number(statusInfo.valor || 0).toLocaleString('pt-BR')}` : 'N/A'}`);
            console.log(`  → Status DERIVADO pelo Dashboard: ${derivedStatus}`);
            console.log('');

            // Diagnóstico do problema
            const stageNorm = normalizeStr(stageName);
            const isVendaConcluida = stageNorm.includes('venda') && (stageNorm.includes('concluid') || stageNorm.includes('concluida'));
            
            console.log(`  🔍 DIAGNÓSTICO:`);
            console.log(`     - nome_etapa "${stageName}" → normalizeStr = "${stageNorm}"`);
            console.log(`     - Contém "venda": ${stageNorm.includes('venda')}`);
            console.log(`     - Contém "concluid": ${stageNorm.includes('concluid')}`);
            console.log(`     - Seria Venda Concluída? ${isVendaConcluida}`);
            
            // Checar contra PREFERRED_ORDER do dataService
            const PREFERRED_ORDER = [
                "entrada do lead", "mensagem inicial", "tentativa de contato",
                "em atendimento", "qualificado", "lead futuro",
                "pre agendamento", "reuniao agendada", "reuniao realizada",
                "proposta enviada", "vendas concluidas"
            ];
            const matchedTerm = PREFERRED_ORDER.find(term => stageNorm.includes(normalizeStr(term)));
            console.log(`     - Termo do PREFERRED_ORDER que dá match: ${matchedTerm ? `"${matchedTerm}"` : '❌ NENHUM'}`);

            if (!matchedTerm) {
                console.log(`\n  ⚠️⚠️ PROBLEMA ENCONTRADO: A etapa "${stageName}" não corresponde a NENHUM termo do PREFERRED_ORDER!`);
                console.log(`     A etapa deveria ser "Vendas Concluídas" mas está como "${stageName}".`);
                console.log(`     Isso faz com que o lead NÃO apareça no funil de Vendas Concluídas.`);
            }

            if (derivedStatus !== 'ganho ✅') {
                console.log(`\n  ⚠️⚠️ PROBLEMA NO VALOR: Status derivado não é "ganho", por isso o valor R$ ${Number(valor||0).toLocaleString('pt-BR')} NÃO é somado ao SITRE.`);
                console.log(`     O campo "atualizado?" = "${atu}" não contém "vendido" nem "sim".`);
                console.log(`     E o CRM Status_venda_2: ${statusInfo ? `"${statusInfo.status}"` : 'NÃO ENCONTRADO'}.`);
            }
        });
    } else {
        console.log('Diney Azevedo NÃO encontrado em Vendas_2.');
    }

    // ==== 2. DINEY em Status_venda_2 ====
    console.log('\n--- REGISTROS DE DINEY em Status_venda_2 ---');
    const dineyInStatus = (status2 || []).filter(row => {
        const allVals = Object.values(row).join(' ');
        return normalizeStr(allVals).includes('diney') || normalizeStr(allVals).includes('azevedo');
    });

    if (dineyInStatus.length > 0) {
        dineyInStatus.forEach((row, i) => {
            console.log(`\n[Status_venda_2 #${i + 1}]`);
            Object.entries(row).forEach(([k, v]) => {
                if (v !== null && v !== undefined && v !== '' && v !== '---') {
                    console.log(`  ${k}: ${v}`);
                }
            });
            const statusVal = row.status || row.venda_status || row.status_venda;
            const valorVal = row.valor || row.vaor || row.value;
            const sNorm = normalizeStr(String(statusVal || ''));
            const isGanho = sNorm.includes('ganho') || sNorm.includes('vendido');
            const isPerdido = sNorm.includes('perdido');
            console.log(`  → Status DERIVADO: ${isGanho ? 'ganho ✅' : isPerdido ? 'perdido ❌' : 'nenhum status claro'}`);
            console.log(`  → Valor somado ao SITRE: ${isGanho ? `R$ ${Number(valorVal || 0).toLocaleString('pt-BR')}` : '0 (não é ganho)'}`);
        });
    } else {
        console.log('Diney Azevedo NÃO encontrado em Status_venda_2.');
        console.log('⚠️ Este é provavelmente o MOTIVO do valor não aparecer no SITRE!');
        console.log('   O dashboard usa Status_venda_2 para confirmar ganhos e somar valores.');
    }

    // ==== 3. DINEY em valores_2 ====
    console.log('\n--- REGISTROS DE DINEY em valores_2 ---');
    const dineyInValores = valores2Data.filter(row => {
        const allVals = Object.values(row).join(' ');
        return normalizeStr(allVals).includes('diney') || normalizeStr(allVals).includes('azevedo');
    });
    if (dineyInValores.length > 0) {
        dineyInValores.forEach((row, i) => {
            console.log(`[valores_2 #${i + 1}]:`, JSON.stringify(row));
        });
    } else {
        console.log('Nenhum em valores_2.');
    }

    // ==== RESUMO FINAL ====
    console.log('\n==============================');
    console.log('RESUMO DO DIAGNÓSTICO');
    console.log('==============================');
    console.log(`Registros de Diney em Vendas_2: ${dineyInSales.length}`);
    console.log(`Registros de Diney em Status_venda_2: ${dineyInStatus.length}`);
    console.log(`Registros de Diney em valores_2: ${dineyInValores.length}`);
}

checkDiney().catch(console.error);
