const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygauqwbbjrqitwustvqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVxd2JianJxaXR3dXN0dnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3OTU1MjgsImV4cCI6MjA1MjM3MTUyOH0.rZKXF5vBjJaHOPqyHLbZKDHdRNlQlECWQfJOXxONqSM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPipelines() {
    console.log('🔍 Verificando pipelines em Vendas_2...\n');

    const { data, error } = await supabase
        .from('Vendas_2')
        .select('*')
        .limit(10);

    if (error) {
        console.error('❌ Erro:', error);
        return;
    }

    console.log('📊 Campos disponíveis:', Object.keys(data[0] || {}));
    console.log('\n📋 Primeiros 10 registros:\n');

    data.forEach((row, i) => {
        console.log(`\n--- Registro ${i + 1} ---`);
        console.log('Nome:', row.nome || row.Nome);
        console.log('ID Pipeline:', row['id pipeline'] || row['ID Pipeline'] || row.id_pipeline || row.pipeline_id);
        console.log('Pipeline:', row.pipeline || row.Pipeline);
        console.log('Status Venda 2:', row.status_venda_2 || row.Status_Venda_2);
    });

    // Contar por pipeline
    console.log('\n\n📊 Contagem por Pipeline:\n');

    const { data: allData } = await supabase
        .from('Vendas_2')
        .select('*');

    const pipelineCounts = {};
    const idPipelineCounts = {};

    allData?.forEach(row => {
        const pipeline = row.pipeline || row.Pipeline || 'Sem Pipeline';
        const idPipeline = row['id pipeline'] || row['ID Pipeline'] || row.id_pipeline || row.pipeline_id || 'Sem ID';

        pipelineCounts[pipeline] = (pipelineCounts[pipeline] || 0) + 1;
        idPipelineCounts[idPipeline] = (idPipelineCounts[idPipeline] || 0) + 1;
    });

    console.log('Por Nome de Pipeline:');
    Object.entries(pipelineCounts).forEach(([name, count]) => {
        console.log(`  ${name}: ${count} leads`);
    });

    console.log('\nPor ID Pipeline:');
    Object.entries(idPipelineCounts).forEach(([id, count]) => {
        console.log(`  ID ${id}: ${count} leads`);
    });

    // Mostrar exemplos de ID Pipeline 3
    console.log('\n\n🎯 Exemplos de leads com ID Pipeline = 3:\n');
    const pipeline3 = allData?.filter(row => {
        const idPipeline = row['id pipeline'] || row['ID Pipeline'] || row.id_pipeline || row.pipeline_id;
        return String(idPipeline) === '3';
    }).slice(0, 5);

    pipeline3?.forEach((row, i) => {
        console.log(`${i + 1}. ${row.nome || row.Nome} - Pipeline: ${row.pipeline || row.Pipeline}`);
    });
}

checkPipelines();
