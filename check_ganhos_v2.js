
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const parseNumeric = (val) => {
    if (val === null || val === undefined || val === "") return 0;
    if (typeof val === 'number') return val;
    let s = val.toString().replace(/[R$\sBRL]/g, '').trim();
    while (s.length > 0 && !/[0-9]/.test(s.slice(-1))) { s = s.slice(0, -1).trim(); }
    if (!s) return 0;
    if (s.includes(',') && s.includes('.') || s.includes(',') || s.includes('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(s) || 0;
};

async function checkGanhos() {
    const { data: v2 } = await supabase.from('Vendas_2').select('*');

    let total = 0;
    v2.forEach((r, i) => {
        const stageId = String(r['ID Etapa'] || r['ID etapa'] || '').trim();
        const stageName = String(r['Nome Etapa'] || r['Nome etapa'] || '').toLowerCase();
        const status2 = String(r['status_venda_2'] || '').toLowerCase();
        const val = parseNumeric(r.valor);

        const isMatched = stageId === '14' || stageName.includes('concluid') || status2.includes('ganho');

        if (isMatched) {
            total += val;
            console.log(`[MATCH] ${r.nome} | Val: ${val} | ID: ${stageId} | Status2: ${status2}`);
        }
    });

    console.log('Total Vendas_2 Ganhos:', total);
}
checkGanhos();
