
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const normalize = (s) => String(s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_]/g, '');

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

async function checkAllPossibleGanhos() {
    const { data: v2 } = await supabase.from('Vendas_2').select('*');
    let total = 0;
    v2.forEach((r, i) => {
        const stage1 = normalize(r['Nome Etapa']);
        const stage2 = normalize(r['Nome Etapa_1']);
        const status = normalize(r['status_venda_2']);
        const id1 = String(r['ID etapa'] || '').trim();

        const isGanho = stage1.includes('concluid') ||
            stage1.includes('ganh') ||
            stage2.includes('concluid') ||
            stage2.includes('ganh') ||
            status.includes('ganh') ||
            id1 === '14';

        if (isGanho) {
            const v = parseNumeric(r.valor);
            total += v;
            console.log(`[GANHO] ${r.nome} | Val: ${v} | S1: ${r['Nome Etapa']} | S2: ${r['Nome Etapa_1']} | ID: ${id1}`);
        }
    });
    console.log('Total Vendas_2 Ganhos:', total);
}
checkAllPossibleGanhos();
