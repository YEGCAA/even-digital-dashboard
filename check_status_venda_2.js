
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

async function checkStatusVenda() {
    const { data, error } = await supabase.from('Status_Venda_2').select('*');
    if (error) { console.error(error); return; }

    let total = 0;
    data.forEach(r => {
        Object.entries(r).forEach(([k, v]) => {
            const n = parseNumeric(v);
            if (n > 1000 && n < 10000000 && !k.toLowerCase().includes('id') && !k.toLowerCase().includes('telefone')) {
                console.log(`Potential value in Status_Venda_2: ${k}=${v} (${n})`);
                total += n;
            }
        });
    });
    console.log('Total Status_Venda_2 Potential:', total);
}
checkStatusVenda();
