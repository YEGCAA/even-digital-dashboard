
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rivyrupuoaxmecidlzsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdnlydXB1b2F4bWVjaWRsenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjM4ODYsImV4cCI6MjA4Mzc5OTg4Nn0.d_VoH1geJQMruwYgvh0BHIIE1sZCEa0xNsbXGyYPFR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCampaign() {
    const targetCampaign = "[HIGH CONTORNO]_[LEADS]_[CBO]_[22.01.2026]";
    console.log(`\n--- Verificando Campanha: ${targetCampaign} ---`);

    const { data, error } = await supabase
        .from('Marketing_2')
        .select('*')
        .eq('Campaign Name', targetCampaign);

    if (error) {
        console.error('Erro ao buscar pelo nome exato "Campaign Name":', error);
    }

    if (!data || data.length === 0) {
        console.log('Nenhum dado encontrado com o nome exato. Tentando busca por texto parcial...');
        const { data: searchData, error: searchErr } = await supabase
            .from('Marketing_2')
            .select('*')
            .ilike('Campaign Name', `%${targetCampaign}%`);

        if (searchErr) console.error('Erro na busca parcial:', searchErr);

        if (searchData && searchData.length > 0) {
            console.log(`Encontradas ${searchData.length} linhas na busca parcial.`);
            summarizeLeads(searchData);
        } else {
            console.log('Também não encontrei nada na busca parcial. Listando as primeiras 5 linhas da tabela para ver as colunas e nomes:');
            const { data: headData, error: headErr } = await supabase.from('Marketing_2').select('*').limit(5);
            if (headErr) console.error(headErr);
            console.log(JSON.stringify(headData, null, 2));
        }
    } else {
        console.log(`Encontradas ${data.length} linhas exatas.`);
        summarizeLeads(data);
    }
}

function summarizeLeads(data) {
    let totalLeads = 0;
    let totalSpend = 0;

    // Verificando nomes de colunas que contenham "Leads" ou "Spent"
    const sample = data[0];
    const keys = Object.keys(sample);
    const leadsKey = keys.find(k => k.toLowerCase() === 'leads');
    const spendKey = keys.find(k => k.toLowerCase().replace(/\s/g, '') === 'amountspent');

    console.log(`Colunas detectadas: Leads -> "${leadsKey}", Spend -> "${spendKey}"`);

    data.forEach((row, i) => {
        const leads = Number(row[leadsKey]) || 0;
        const spend = Number(row[spendKey]) || 0;
        totalLeads += leads;
        totalSpend += spend;
        if (i < 3) console.log(`Linha ${i + 1}: Leads: ${leads}, Spent: ${spend}`);
    });

    console.log(`\nRESULTADO PARA A CAMPANHA:`);
    console.log(`TOTAL LEADS: ${totalLeads}`);
    console.log(`TOTAL SPENT: ${totalSpend}`);
    console.log(`CPL: ${totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : 'N/A'}`);
}

checkCampaign();
