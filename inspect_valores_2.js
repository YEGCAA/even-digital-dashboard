
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectValores2() {
    const { data, error } = await supabase.from('valores_2').select('*').limit(5);
    if (error) {
        console.error('Error fetching valores_2:', error.message);
    } else {
        console.log('Sample from valores_2:', data);
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        }
    }
}
inspectValores2();
