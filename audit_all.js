
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

async function auditAll() {
    const { data: v2 } = await supabase.from('Vendas_2').select('*');
    const { data: val2 } = await supabase.from('valores_2').select('*');

    let total = 0;
    console.log('--- Vendas_2 ---');
    v2.forEach(r => {
        const stage = String(r['Nome Etapa'] || '').toLowerCase();
        if (stage.includes('concluid')) {
            const v = parseNumeric(r.valor);
            total += v;
            console.log(`${r.nome}: ${v}`);
        }
    });
    console.log('--- valores_2 ---');
    val2.forEach(r => {
        const v = parseNumeric(r.valor);
        total += v;
        if (v > 0) console.log(`${r.nome}: ${v}`);
    });
    console.log('TOTAL CALCULADO:', total);
    console.log('TOTAL ESPERADO:', 19865647.43);
}
auditAll();
