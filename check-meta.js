
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectTableStructure() {
    console.log('Inspecting Meta_2 column names...');

    // Attempt to insert a completely empty row to trigger a column hint error if fails,
    // or just select to see if we can get any info.
    const { data, error } = await supabase
        .from('Meta_2')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Connected to Meta_2');
        if (data && data.length > 0) {
            console.log('Existing Columns:', Object.keys(data[0]).join(', '));
        } else {
            console.log('Table is empty. Please ensure columns are named exactly: orçamento, leads, cpl, ctr, cpm, frequencia');
        }
    }
}

inspectTableStructure();
