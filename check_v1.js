
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const parseNumeric = (val) => {
    if (val === null || val === undefined || val === "") return 0;
    if (typeof val === 'number') return val;
    let s = val.toString().replace(/[R$\sBRL]/g, '').trim();
    while (s.length > 0 && !/[0-9]/.test(s.slice(-1))) { s = s.slice(0, -1).trim(); }
    if (!s) return 0;
    if (s.includes(',') && s.includes('.') || s.includes(',') || s.includes('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(s) || 0;
};

async function checkCols1() {
    const { data } = await supabase.from('Vendas_2').select('*');

    let total1 = 0;
    data.forEach((r, i) => {
        const v1 = parseNumeric(r.valor_1);
        const stageId1 = String(r['ID etapa_1'] || '').trim();
        const stageName1 = String(r['Nome Etapa_1'] || '').toLowerCase();

        if (v1 > 0) {
            console.log(`[ROW ${i}] valor_1: ${v1} | stageId1: ${stageId1} | stageName1: ${stageName1}`);
            if (stageId1 === '14' || stageName1.includes('concluid')) {
                total1 += v1;
            }
        }
    });
    console.log('Total Stage 14 in valor_1:', total1);
}
checkCols1();
