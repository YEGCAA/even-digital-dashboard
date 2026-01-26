
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findStatusTables() {
    const names = [
        'Status_Venda',
        'Status_Venda_2',
        'Vendas_Status',
        'Vendas_Status_2',
        'StatusVenda',
        'StatusVenda2'
    ];
    for (const name of names) {
        const { data, error } = await supabase.from(name).select('*').limit(1);
        if (!error) {
            console.log(`FOUND table: ${name}`);
        }
    }
}

findStatusTables();
