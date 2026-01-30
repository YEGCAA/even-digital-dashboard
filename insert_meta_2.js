
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const dummy = {
        Orçamento: 200,
        Leads: 20,
        CPL: 20,
        CTR: 2,
        CPM: 40,
        Frequência: 2,
        Quantidade: 10
    };
    const { data, error } = await supabase.from('Meta_2').insert([dummy]).select();
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Inserted:', JSON.stringify(data, null, 2));
    }
}

run();
