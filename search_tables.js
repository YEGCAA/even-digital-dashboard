
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findTableNames() {
    // Try some very specific names that might exist
    const names = [
        'Vendas_2',
        'Vendas_Pedrosa',
        'Vendas_Pedrosa_v2',
        'Vendas_ID_2',
        'Marketing_2',
        'Marketing_Pedrosa',
        'Vendas_Concluidas',
        'Vendas_Geral'
    ];

    for (const name of names) {
        const { data, error } = await supabase.from(name).select('*').limit(1);
        if (!error) {
            console.log(`FOUND: ${name}`);
            if (data && data.length > 0) {
                console.log(`Columns for ${name}:`, Object.keys(data[0]));
            }
        }
    }
}

findTableNames();
