
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const content = fs.readFileSync('c:/Users/Eliana/Documents/PEDRO/VScode/even-digital-dashboard-_-final/services/supabase.ts', 'utf8');
const urlMatch = content.match(/SUPABASE_URL = '(.*?)'/);
const keyMatch = content.match(/SUPABASE_ANON_KEY = '(.*?)'/);

const SUPABASE_URL = urlMatch[1];
const SUPABASE_ANON_KEY = keyMatch[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase.from('status_venda_2').select('*').limit(1);
    if (data && data[0]) {
        console.log("Columns of status_venda_2:", Object.keys(data[0]));
    } else {
        console.log("No data in status_venda_2 or error:", error ? error.message : "Empty");
    }
}
test();
