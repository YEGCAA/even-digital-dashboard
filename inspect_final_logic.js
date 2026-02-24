
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectFinal() {
    // 1. Get latest goals
    const { data: goalData } = await supabase.from('Meta_2').select('*').order('id', { ascending: false }).limit(1);
    const goals = goalData[0];

    // 2. Get some marketing data to estimate current spend/cpl
    // Assuming we can look at some marketing table to see the numbers
    // But since I don't know the client ID being viewed, I'll just check what's in Meta_2

    console.log('Goals from Meta_2:', goals);

    // The user mentioned CPL and Investment.
    // In Meta_2: Orçamento (Investment) and CPL.
}

inspectFinal();
