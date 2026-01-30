
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    // Try to get one row to see keys
    const { data, error } = await supabase.from('Meta_2').select('*').limit(1);
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Keys:', data.length > 0 ? Object.keys(data[0]) : 'Empty table');
    }

    // Also try to insert a dummy row to see what works
    const dummy = {
        Orçamento: 100,
        Leads: 10,
        CPL: 10,
        CTR: 1,
        CPM: 20,
        Frequência: 1,
        Quantidade: 5
    };
    const { error: insError } = await supabase.from('Meta_2').insert([dummy]);
    if (insError) {
        console.log('Insert error info:', insError.message);
    } else {
        console.log('Successfully inserted dummy row');
    }
}

run();
