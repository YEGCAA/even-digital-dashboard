
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
        // simplified for search
        s = s.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(s) || 0;
};

async function search() {
    const tables = ['Vendas_2', 'Marketing_2', 'Dados_2', 'Status_Venda_2', 'valores_2'];
    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('*');
        if (error) continue;
        data.forEach((row, i) => {
            Object.entries(row).forEach(([key, val]) => {
                const n = parseNumeric(val);
                if (Math.abs(n - 1000323.37) < 100 || n > 1000000) {
                    console.log(`FOUND in ${t}[${i}]: ${key} = ${val}`);
                }
            });
        });
    }
}
search();
