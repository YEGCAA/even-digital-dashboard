
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function searchValues() {
    const { data, error } = await supabase.from('Vendas_2').select('*');
    if (error) {
        console.log('Error:', error.message);
        return;
    }

    const targets = ['ganho', 'perdido', 'normal'];
    const foundInColumns = new Set();

    data.forEach(row => {
        Object.entries(row).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
                const lowerVal = value.toLowerCase();
                if (targets.some(t => lowerVal.includes(t))) {
                    foundInColumns.add(key);
                    console.log(`Found "${value}" in column "${key}"`);
                }
            }
        });
    });

    console.log('Columns containing target values:', Array.from(foundInColumns));
}

searchValues();
