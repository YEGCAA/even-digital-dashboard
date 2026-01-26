
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findTables() {
    // Try some common table names
    const names = [
        'Vendas_2_v2',
        'Vendas_2_new',
        'Vendas_Pedrosa',
        'Leads_Pedrosa',
        'Vendas_V2',
        'Vendas_3',
        'Vendas'
    ];

    for (const name of names) {
        const { data, error } = await supabase.from(name).select('*').limit(1);
        if (!error) {
            console.log(`Table ${name} exists! Columns:`, Object.keys(data[0] || {}));
        } else {
            console.log(`Table ${name} not found:`, error.message);
        }
    }
}

findTables();
