
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    console.log("Testing Status_Venda_2...");
    const r1 = await supabase.from('Status_Venda_2').select('*').limit(1);
    console.log("Status_Venda_2:", r1.error ? r1.error.message : "Success");

    console.log("Testing status_venda_2...");
    const r2 = await supabase.from('status_venda_2').select('*').limit(1);
    console.log("status_venda_2:", r2.error ? r2.error.message : "Success");

    console.log("Testing status_venda_2 (quoted)...");
    const r3 = await supabase.from('"status_venda_2"').select('*').limit(1);
    console.log('"status_venda_2":', r3.error ? r3.error.message : "Success");
}
test();
