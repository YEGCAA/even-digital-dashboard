
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listTables() {
    // In Supabase/Postgres, we can query information_schema or just try to fetch from common names
    // But since we are using the anon key, we might have limited access to information_schema.
    // However, for this project, the previous agents seemed to know the tables.

    // Let's try to find if there is a 'Vendas_Pedrosa' or similar.
    // Or just look at what 'Vendas_2' actually contains.

    const { data: userRows, error: userError } = await supabase.from('Logins Even').select('*');
    console.log('Logins:', userRows);

    const { data, error } = await supabase.from('Vendas_2').select('*').limit(1);
    console.log('Sample row from Vendas_2:', data);
}

listTables();
