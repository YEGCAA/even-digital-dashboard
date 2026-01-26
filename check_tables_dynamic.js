
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    const ts = [
        'Dados_2', 'Marketing_2', 'Vendas_2', 'Status_Venda_2',
        'Dados_3', 'Marketing_3', 'Vendas_3', 'Status_Venda_3',
        'Dados_4', 'Marketing_4', 'Vendas_4', 'Status_Venda_4',
        'Dados', 'Marketing', 'Vendas', 'Status_Venda'
    ];
    for (const t of ts) {
        const { error } = await supabase.from(t).select('*').limit(1);
        console.log(`${t}: ${!error ? 'EXISTS' : 'NO (' + error.message + ')'}`);
    }
}
check();
