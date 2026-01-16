// Simplified diagnostic script that outputs JSON
(async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const fs = await import('fs');

    const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const results = {
        loginsEven: null,
        pedrosaTest: null,
        adminTest: null,
        tables: {}
    };

    // Check Logins Even
    const { data: users, error: usersError } = await supabase
        .from('Logins Even')
        .select('*');

    if (usersError) {
        results.loginsEven = { error: usersError.message, code: usersError.code };
    } else {
        results.loginsEven = { count: users?.length || 0, users: users || [] };
    }

    // Test pedrosa login
    const { data: pedrosaData, error: pedrosaError } = await supabase
        .from('Logins Even')
        .select('*')
        .eq('user', 'pedrosa')
        .eq('senha', 'pedrosa')
        .single();

    results.pedrosaTest = pedrosaError ? { error: pedrosaError.message } : { found: !!pedrosaData, data: pedrosaData };

    // Test admin login
    const { data: adminData, error: adminError } = await supabase
        .from('Logins Even')
        .select('*')
        .eq('user', 'admin')
        .eq('senha', 'admin')
        .single();

    results.adminTest = adminError ? { error: adminError.message } : { found: !!adminData, data: adminData };

    // Check Vendas_2
    const { data: vendasSample, error: vendasError } = await supabase
        .from('Vendas_2')
        .select('*')
        .limit(1);

    if (vendasError) {
        results.tables.Vendas_2 = { error: vendasError.message };
    } else {
        results.tables.Vendas_2 = {
            accessible: true,
            isEmpty: !vendasSample || vendasSample.length === 0,
            columns: vendasSample && vendasSample.length > 0 ? Object.keys(vendasSample[0]) : []
        };
    }

    // Save to file
    fs.writeFileSync('diagnostic-results.json', JSON.stringify(results, null, 2), 'utf8');

    console.log('Results saved to diagnostic-results.json');
    console.log(JSON.stringify(results, null, 2));
})().catch(err => {
    console.error('ERROR:', err.message);
});
