
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkFeb24() {
    console.log('--- Checking Marketing_14 ---');
    const { data: mData, error: mError } = await supabase
        .from('Marketing_14')
        .select('*')
        .gte('Date', '2026-02-24T00:00:00')
        .lte('Date', '2026-02-24T23:59:59');

    if (mError) console.error('Error Marketing_14:', mError.message);
    else console.log('Marketing_14 count for Feb 24:', mData?.length || 0);

    console.log('\n--- Checking Status_venda_14 ---');
    const { data: sData, error: sError } = await supabase
        .from('Status_venda_14')
        .select('*')
        .gte('data', '2026-02-24T00:00:00')
        .lte('data', '2026-02-24T23:59:59');

    if (sError) console.error('Error Status_venda_14:', sError.message);
    else console.log('Status_venda_14 count for Feb 24:', sData?.length || 0);

    if (sData && sData.length > 0) {
        console.log('Sample data from Status_venda_14 (Feb 24):', sData[0]);
    }

    // Also check without the T-format just in case
    console.log('\n--- Checking Status_venda_14 (Alternate Format) ---');
    const { data: sDataAlt, error: sErrorAlt } = await supabase
        .from('Status_venda_14')
        .select('*')
        .ilike('data', '%24/02/2026%');

    console.log('Status_venda_14 (ilike 24/02/2026) count:', sDataAlt?.length || 0);
}

checkFeb24();
