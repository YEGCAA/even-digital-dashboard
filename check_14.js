
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

async function check14() {
    const { data } = await supabase.from('Vendas_2').select('*');
    let total = 0;
    data.forEach(r => {
        const id1 = String(r['ID etapa'] || '').trim();
        const id2 = String(r['ID Etapa'] || '').trim();
        const id3 = String(r['ID etapa_1'] || '').trim();

        if (id1 === '14' || id2 === '14' || id3 === '14') {
            const v = parseNumeric(r.valor);
            total += v;
            console.log(`Row: ${r.nome} | Val: ${v} | IDs: ${id1}, ${id2}, ${id3}`);
        }
    });
    console.log('Total Stage 14:', total);
}
check14();
