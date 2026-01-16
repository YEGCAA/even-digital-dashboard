
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function discover() {
    console.log('Inserting temp row to discover columns...');
    const { error: insErr } = await supabase.from('Meta_2').insert({ id: 888 }).select();
    if (insErr) {
        console.log('Insert failed:', insErr.message);
    } else {
        const { data, error } = await supabase.from('Meta_2').select('*').eq('id', 888).single();
        if (data) {
            console.log('Columns found in table:', Object.keys(data).join(', '));
            await supabase.from('Meta_2').delete().eq('id', 888);
        } else {
            console.log('Select failed:', error?.message);
        }
    }
}

discover();
