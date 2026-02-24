
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
    console.log('--- Inspecting Status_Venda_2 ---');
    const { data: statusData, error: statusError } = await supabase.from('Status_Venda_2').select('*').limit(5);
    if (statusError) console.error('Error fetching Status_Venda_2:', statusError);
    else console.log('Status_Venda_2 Sample:', JSON.stringify(statusData, null, 2));

    console.log('\n--- Inspecting valores_2 ---');
    const { data: valoresData, error: valoresError } = await supabase.from('valores_2').select('*').limit(5);
    if (valoresError) console.error('Error fetching valores_2:', valoresError);
    else console.log('valores_2 Sample:', JSON.stringify(valoresData, null, 2));
}

inspect();
