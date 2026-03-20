
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const normalizeStr = (s) => String(s || '').toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]/g, '');

const findValue = (row, keys) => {
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
        const found = rowKeys.find(rk => {
            const nrk = normalizeStr(rk);
            if (nrk.includes("custo") || nrk.includes("cost")) return false;
            return nrk.includes(normalizedSearchKey);
        });
        if (found && row[found] !== null && row[found] !== "" && row[found] !== undefined) {
            return row[found];
        }
    }
    return null;
};

async function debug() {
    const { data: sales } = await supabase.from('Vendas_2').select('*');
    
    // Pega o Diney
    const diney = (sales || []).find(r => normalizeStr(String(r.nome || r.name || '')).includes('diney'));
    
    if (!diney) {
        console.log('❌ Diney não encontrado em Vendas_2');
        return;
    }

    console.log('✅ Diney encontrado!');
    console.log('Chaves do registro:', Object.keys(diney));
    console.log('Todos os valores:');
    Object.entries(diney).forEach(([k, v]) => console.log(`  "${k}": "${v}"`));
    
    const stageName = findValue(diney, ["Nome Etapa", "Status", "etapa", "fase"]);
    console.log(`\nfindValue("Nome Etapa", ...) => "${stageName}"`);
    const stageNorm = normalizeStr(String(stageName || ''));
    console.log(`normalizeStr("${stageName}") => "${stageNorm}"`);
    console.log(`stageNorm.includes("vendaconcluida") => ${stageNorm.includes("vendaconcluida")}`);
    console.log(`stageNorm.includes("vendasconcluidas") => ${stageNorm.includes("vendasconcluidas")}`);
    
    const EXPECTED_STATUS = (stageNorm.includes("vendaconcluida") || stageNorm.includes("vendasconcluidas")) ? "ganho" : "NÃO É GANHO";
    console.log(`\n→ Status derivado pelo novo código: "${EXPECTED_STATUS}"`);
    
    // Também checa o campo de valor
    const valor = findValue(diney, ["valor"]);
    console.log(`\nValor: ${valor}`);
    
    // Checa a data e se passaria pelo filtro de março
    const dataVal = diney.Date || diney.Day || diney.dia || diney.data || diney.created_at;
    console.log(`Data do registro (para filtro): ${dataVal}`);
    
    // Simula filterstart/end do dashboard (março 2026)
    const startDate = '2026-03-01';
    const endDate = '2026-03-20';
    let rowDateNorm = String(dataVal || '');
    if (rowDateNorm.includes('T')) rowDateNorm = rowDateNorm.split('T')[0];
    console.log(`\nData normalizada: ${rowDateNorm}`);
    console.log(`Filtro: ${startDate} até ${endDate}`);
    const passaFiltro = (!startDate || rowDateNorm >= startDate) && (!endDate || rowDateNorm <= endDate);
    console.log(`Passa pelo filtro de data? ${passaFiltro ? '✅ SIM' : '❌ NÃO'}`);
}

debug().catch(console.error);
