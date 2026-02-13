
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findEberte() {
    const { data: sData } = await supabase.from('Status_Venda_2').select('*').ilike('nome', '%Eberte%');
    console.log('Eberte in Status_Venda_2:', JSON.stringify(sData, null, 2));

    const { data: vData } = await supabase.from('valores_2').select('*').ilike('nome', '%Eberte%');
    console.log('Eberte in valores_2:', JSON.stringify(vData, null, 2));
}
findEberte();
