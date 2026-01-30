
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCampaign() {
    const targetCampaign = "[HIGH CONTORNO]_[LEADS]_[CBO]_[22.01.2026]";
    console.log(`Buscando campanha: ${targetCampaign}`);

    const { data, error } = await supabase
        .from('Marketing_2')
        .select('*')
        .eq('Campaign Name', targetCampaign);

    if (error) {
        console.error('Erro ao buscar:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('Nenhum dado encontrado com o nome exato "Campaign Name". Tentando busca flexível...');
        const { data: allData, error: allErr } = await supabase.from('Marketing_2').select('*').limit(10);
        if (allErr) console.error(allErr);
        console.log('Amostra de dados (primeiras 10 linhas):', JSON.stringify(allData, null, 2));
        return;
    }

    console.log(`Encontradas ${data.length} linhas.`);
    let totalLeads = 0;
    data.forEach((row, i) => {
        const leadsVal = row['Leads'];
        console.log(`Linha ${i + 1}: Leads = ${leadsVal} (tipo: ${typeof leadsVal})`);
        totalLeads += (Number(leadsVal) || 0);
    });

    console.log(`Soma de Leads para essa campanha: ${totalLeads}`);
}

checkCampaign();
