
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    const list = ['Vendas_2', 'Marketing_2', 'Dados_2', 'Status_Venda_2', 'valores_2', 'status_venda_2', 'status_venda2'];
    for (const t of list) {
        const { error, data } = await supabase.from(t).select('*').limit(1);
        console.log(`${t}:`, error ? error.message : "Success");
    }
}
test();
