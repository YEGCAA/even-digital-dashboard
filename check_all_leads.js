
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllRows() {
    console.log(`\n--- Verificando TODAS as linhas de Marketing_2 ---`);

    const { data, error } = await supabase
        .from('Marketing_2')
        .select('*');

    if (error) {
        console.error('Erro ao buscar dados:', error);
        return;
    }

    console.log(`Total de linhas na tabela: ${data.length}`);

    const rowsWithLeads = data.filter(row => Number(row.Leads) > 0);
    console.log(`Linhas com Leads > 0: ${rowsWithLeads.length}`);

    if (rowsWithLeads.length > 0) {
        console.log('\nExemplo de linhas que POSSUEM leads:');
        rowsWithLeads.slice(0, 5).forEach(row => {
            console.log(`Data: ${row.Day} | Campanha: ${row['Campaign Name']} | Leads: ${row.Leads}`);
        });

        const campaignsWithLeads = [...new Set(rowsWithLeads.map(row => row['Campaign Name']))];
        console.log('\nCampanhas que possuem algum lead registrado no banco:');
        campaignsWithLeads.forEach(c => console.log(`- ${c}`));
    } else {
        console.log('\nAVISO: NENHUMA linha em toda a tabela Marketing_2 possui valor na coluna "Leads" maior que 0.');
        console.log('Verificando se existem outras colunas de resultado...');
        const keys = Object.keys(data[0]);
        console.log('Colunas disponíveis:', keys.join(', '));
    }
}

checkAllRows();
