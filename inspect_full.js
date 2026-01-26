
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectFull() {
    const { data, error } = await supabase.from('Vendas_2').select('*');
    if (error) {
        console.log('Error:', error.message);
    } else {
        const allKeys = new Set();
        data.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
        console.log('Total rows:', data.length);
        console.log('All unique keys across all rows:', Array.from(allKeys));

        // Let's also check if any row has status_venda_2 (case insensitive)
        const rowWithStatus = data.find(row =>
            Object.keys(row).some(k => k.toLowerCase().includes('statusvenda') || k.toLowerCase().includes('status_venda'))
        );
        if (rowWithStatus) {
            console.log('Found a row with status-like key:', rowWithStatus);
        } else {
            console.log('No status-like key found in any row.');
        }
    }
}

inspectFull();
