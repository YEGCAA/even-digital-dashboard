const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ygauqwbbjrqitwustvqr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYXVxd2JianJxaXR3dXN0dnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3OTU1MjgsImV4cCI6MjA1MjM3MTUyOH0.rZKXF5vBjJaHOPqyHLbZKDHdRNlQlECWQfJOXxONqSM';

const supabase = createClient(supabaseUrl, supabaseKey);

const normalizeStr = (s) => s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]/g, '');

async function debugPipelines() {
    console.log('🔍 Debugando classificação de pipelines...\n');

    const { data, error } = await supabase
        .from('Vendas_2')
        .select('*')
        .limit(20);

    if (error) {
        console.error('❌ Erro:', error.message);
        return;
    }

    console.log(`📊 Total de leads analisados: ${data.length}\n`);

    let reservaSalCount = 0;
    let highContornoCount = 0;

    data.forEach((row, i) => {
        const nome = row.nome || row.Nome || 'Sem nome';
        const pipelineId = row['id pipeline'] || row['ID Pipeline'] || row.id_pipeline || row.pipeline_id || '';
        const pipelineName = row.pipeline || row.Pipeline || '';
        const statusVenda2 = row.status_venda_2 || row.Status_Venda_2 || '';

        // Aplicar a mesma lógica do código
        const pipelineNorm = normalizeStr(String(pipelineName));
        const isReservaSal = String(pipelineId) === "3" || pipelineNorm.includes("reserva");
        const finalPipeline = isReservaSal ? "Reserva do Sal" : "High Contorno";

        if (finalPipeline === "Reserva do Sal") {
            reservaSalCount++;
        } else {
            highContornoCount++;
        }

        console.log(`\n${i + 1}. ${nome}`);
        console.log(`   ID Pipeline: "${pipelineId}"`);
        console.log(`   Pipeline Name: "${pipelineName}"`);
        console.log(`   Status Venda 2: "${statusVenda2}"`);
        console.log(`   → Classificado como: ${finalPipeline}`);
        console.log(`   Motivo: ${isReservaSal ? (String(pipelineId) === "3" ? "ID = 3" : "Nome contém 'reserva'") : "Outros"}`);
    });

    console.log(`\n\n📊 RESUMO:`);
    console.log(`   Reserva do Sal: ${reservaSalCount} leads`);
    console.log(`   High Contorno: ${highContornoCount} leads`);
}

debugPipelines().catch(console.error);
