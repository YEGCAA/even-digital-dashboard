
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
    console.log('--- Searching for Ebert in Status_venda_2 ---');
    const { data: statusData, error: statusError } = await supabase
        .from('Status_venda_2')
        .select('*')
        .ilike('titulo do negocio', '%ebert%');

    if (statusError) console.error('Error:', statusError);
    else console.log('Ebert rows:', JSON.stringify(statusData, null, 2));

    const { data: statusData2, error: statusError2 } = await supabase
        .from('Status_venda_2')
        .select('*')
        .ilike('nome', '%ebert%');

    if (statusError2) console.error('Error:', statusError2);
    else console.log('Ebert rows by name:', JSON.stringify(statusData2, null, 2));
}

inspect();
