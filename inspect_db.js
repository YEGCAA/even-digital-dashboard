
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
    const { data: v2, error: v2e } = await supabase.from('Vendas_2').select('*').limit(1);
    if (v2e) console.log('Vendas_2 error:', v2e);
    else console.log('Vendas_2 sample keys:', Object.keys(v2[0] || {}));

    const { data: v1, error: v1e } = await supabase.from('Vendas_1').select('*').limit(1);
    if (v1e) console.log('Vendas_1 error:', v1e);
    else console.log('Vendas_1 sample keys:', Object.keys(v1[0] || {}));
}

inspect();
