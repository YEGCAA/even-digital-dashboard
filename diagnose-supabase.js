// Script to check Logins Even table and diagnose auth issues
(async () => {
    const { createClient } = await import('@supabase/supabase-js');

    const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('='.repeat(60));
    console.log('SUPABASE AUTHENTICATION DIAGNOSTIC');
    console.log('='.repeat(60));
    console.log('\n1. Checking Logins Even table...\n');

    // Try to fetch all users from Logins Even
    const { data: users, error: usersError } = await supabase
        .from('Logins Even')
        .select('*');

    if (usersError) {
        console.error('❌ Error accessing Logins Even table:');
        console.error('   Message:', usersError.message);
        console.error('   Code:', usersError.code);
        console.error('   Details:', usersError.details);
        console.error('   Hint:', usersError.hint);
        console.log('\n⚠️  This is likely a Row Level Security (RLS) issue.');
        console.log('   The table might require authentication to read.');
    } else if (!users || users.length === 0) {
        console.log('⚠️  Logins Even table is EMPTY!');
        console.log('   No users found in the database.');
    } else {
        console.log(`✅ Found ${users.length} user(s) in Logins Even table:\n`);
        users.forEach((user, index) => {
            console.log(`   User ${index + 1}:`);
            console.log(`   - ID: ${user.id}`);
            console.log(`   - Username: ${user.user}`);
            console.log(`   - Password: ${user.senha ? '***' + user.senha.slice(-3) : 'N/A'}`);
            console.log(`   - All fields:`, Object.keys(user).join(', '));
            console.log('');
        });
    }

    console.log('\n2. Testing specific login queries...\n');

    // Test query for pedrosa
    const { data: pedrosadata, error: pedrosaError } = await supabase
        .from('Logins Even')
        .select('*')
        .eq('user', 'pedrosa')
        .eq('senha', 'pedrosa')
        .single();

    if (pedrosaError) {
        console.log('❌ pedrosa/pedrosa login query failed:', pedrosaError.message);
    } else if (pedrosadata) {
        console.log('✅ pedrosa/pedrosa credentials exist in database');
    } else {
        console.log('⚠️  pedrosa/pedrosa not found');
    }

    // Test query for admin
    const { data: adminData, error: adminError } = await supabase
        .from('Logins Even')
        .select('*')
        .eq('user', 'admin')
        .eq('senha', 'admin')
        .single();

    if (adminError) {
        console.log('❌ admin/admin login query failed:', adminError.message);
    } else if (adminData) {
        console.log('✅ admin/admin credentials exist in database');
    } else {
        console.log('⚠️  admin/admin not found');
    }

    console.log('\n3. Checking other tables...\n');

    const tables = [
        { name: 'Marketing_2', description: 'Marketing data for user ID 2' },
        { name: 'Vendas_2', description: 'Sales data for user ID 2' },
        { name: 'Dados', description: 'General configuration data' }
    ];

    for (const table of tables) {
        const { data, error, count } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ ${table.name}: ${error.message}`);
        } else {
            console.log(`✅ ${table.name}: Accessible (${table.description})`);

            // Try to get first row to see columns
            const { data: sample } = await supabase
                .from(table.name)
                .select('*')
                .limit(1);

            if (sample && sample.length > 0) {
                console.log(`   Columns: ${Object.keys(sample[0]).join(', ')}`);
                console.log(`   Sample data available: Yes`);
            } else {
                console.log(`   Table is empty`);
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSTIC COMPLETE');
    console.log('='.repeat(60));
})().catch(err => {
    console.error('\n❌ FATAL ERROR:', err.message);
    console.error(err);
});
