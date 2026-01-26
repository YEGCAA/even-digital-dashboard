
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
    if (s.includes(',') && s.includes('.')) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) { s = s.replace(/\./g, '').replace(',', '.'); }
        else { s = s.replace(/,/g, ''); }
    } else if (s.includes(',')) {
        const parts = s.split(',');
        if (parts[parts.length - 1].length <= 2) { s = s.replace(',', '.'); }
        else { s = s.replace(',', ''); }
    } else if (s.includes('.')) {
        const parts = s.split('.');
        if (parts[parts.length - 1].length > 2) { s = s.replace(/\./g, ''); }
    }
    return parseFloat(s) || 0;
};

async function audit() {
    const { data, error } = await supabase.from('valores_2').select('*');
    if (error) { console.error(error); return; }

    let total = 0;
    data.forEach((row, idx) => {
        // Try to sum ALL numeric-looking values in the row except for ID-like fields
        Object.entries(row).forEach(([key, val]) => {
            if (key.toLowerCase().includes('valor') || key.toLowerCase().includes('vgv') || key.toLowerCase().includes('venda')) {
                const n = parseNumeric(val);
                total += n;
                if (n > 0) console.log(`${idx}: [${key}] = ${n} (${val})`);
            }
        });
    });

    console.log('Total Audit:', total);
}
audit();
