
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkActualSpend() {
    // List tables to find marketing ones
    const tables = ['Marketing_1', 'Marketing_2', 'Marketing_3', 'Marketing_7', 'Marketing_14', 'Marketing_15'];

    let totalSpend = 0;

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (data) {
            data.forEach(row => {
                const val = row["Amount Spent"] || row["investimento"] || row["valor gasto"] || row["custo"] || row["gastos"] || row["spent"];
                if (val) {
                    let s = val.toString().replace(/[R$\sBRL]/g, '').trim();
                    // Minimal parsing
                    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
                    else if (s.includes(',')) s = s.replace(',', '.');
                    const num = parseFloat(s);
                    if (!isNaN(num)) totalSpend += num;
                }
            });
        }
    }

    console.log('Total Spend across typical marketing tables:', totalSpend);
}

checkActualSpend();
