
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function dump() {
    const { data, error } = await supabase.from('Marketing_2').select('*').limit(3);
    if (error) console.error(error);
    console.log(JSON.stringify(data, null, 2));
}

dump();
