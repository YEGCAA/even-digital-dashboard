
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function globalSearch() {
    const tables = ['Vendas_2', 'Marketing_2', 'Dados', 'Meta_2', 'Logins Even'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(100);
        if (error) continue;
        const allKeys = new Set();
        data.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
        console.log(`Table ${table} keys:`, Array.from(allKeys));

        const found = data.find(row =>
            Object.keys(row).some(k => k.toLowerCase().includes('statusvenda') || k.toLowerCase().includes('status_venda'))
        );
        if (found) {
            console.log(`!!! Found in ${table}:`, found);
        }
    }
}

globalSearch();
