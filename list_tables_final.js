
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function list() {
    // There is no standard RPC for listing tables unless created by user.
    // I will try to fetch some common names.
    const tables = ['Vendas_2', 'Marketing_2', 'Dados_2', 'Status_Venda_2', 'valores_2', 'Vendas_3', 'valores_3', 'Vendas_4', 'valores_4'];
    for (const t of tables) {
        const { error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        if (!error) console.log(`Table exists: ${t}`);
    }
}
list();
