
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
    console.log('--- Inspecting Status_venda_2 ---');
    const { data: statusData, error: statusError } = await supabase.from('Status_venda_2').select('*').limit(10);
    if (statusError) {
        console.error('Error fetching Status_venda_2:', statusError);
        // Try other variations just in case
        const variants = ['status_venda_2', 'Status_Venda_2', 'Status_venda_2'];
        for (const v of variants) {
            const { data, error } = await supabase.from(v).select('*').limit(1);
            if (!error) {
                console.log(`Found table with name: ${v}`);
                break;
            } else {
                console.log(`Variation ${v} failed: ${error.message}`);
            }
        }
    } else {
        console.log('Status_venda_2 Sample:', JSON.stringify(statusData, null, 2));
    }
}

inspect();
