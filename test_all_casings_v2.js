
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const content = fs.readFileSync('c:/Users/Eliana/Documents/PEDRO/VScode/even-digital-dashboard-_-final/services/supabase.ts', 'utf8');
const urlMatch = content.match(/SUPABASE_URL = '(.*?)'/);
const keyMatch = content.match(/SUPABASE_ANON_KEY = '(.*?)'/);

const SUPABASE_URL = urlMatch[1];
const SUPABASE_ANON_KEY = keyMatch[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    const names = ['Status_venda_2', 'status_venda_2', 'Status_Venda_2'];
    for (const name of names) {
        const { error, data } = await supabase.from(name).select('*').limit(1);
        console.log(`${name}:`, error ? `Fail (${error.message})` : `Success (${data.length} rows)`);
    }
}
test();
