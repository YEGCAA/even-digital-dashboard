
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    const tableNames = [
        "Vendas High Contorno",
        "Vendas Reserva do Sal",
        "Status_venda_High",
        "Status_venda_Reserva",
        "valores_High_Contorno"
    ];

    for (const table of tableNames) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`Error counting table ${table}:`, error.message);
        } else {
            console.log(`${table}: ${count}`);
        }
    }
}

main();
