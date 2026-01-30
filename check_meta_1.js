
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('Meta_1').select('*').limit(1);
    if (error) console.log('Meta_1 error:', error.message);
    else console.log('Meta_1 exists');
}
run();
