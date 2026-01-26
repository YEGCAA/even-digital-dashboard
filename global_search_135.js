
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function globalSearch() {
    const ts = ['Vendas_2', 'Marketing_2', 'valores_2', 'Status_Venda_2'];
    for (const t of ts) {
        const { data } = await supabase.from(t).select('*');
        data.forEach((r, i) => {
            Object.entries(r).forEach(([k, v]) => {
                if (String(v).includes('135')) {
                    console.log(`FOUND "135" in ${t}[${i}] field ${k}: ${v}`);
                }
            });
        });
    }
}
globalSearch();
