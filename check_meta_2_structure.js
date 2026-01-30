import { createClient } from '@supabase/supabase-js';

// Substitua com suas credenciais do Supabase
const supabaseUrl = 'https://qgvzfvuqzwdnhvxdxkxn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFndnpmdnVxendkbmh2eGR4a3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjI0MzAsImV4cCI6MjA1MjUzODQzMH0.xDlZnkKgDvkKMPMpqYTjdvWLlPjPMqJPFqNKBJNXZBU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMeta2Columns() {
    console.log('🔍 Verificando colunas da tabela Meta_2...\n');

    try {
        // Buscar uma linha para ver as colunas existentes
        const { data, error } = await supabase
            .from('Meta_2')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Erro ao acessar Meta_2:', error.message);
            return;
        }

        if (data && data.length > 0) {
            console.log('✅ Colunas existentes na tabela Meta_2:');
            const columns = Object.keys(data[0]);
            columns.forEach(col => console.log(`  - ${col}`));

            console.log('\n📋 Colunas necessárias:');
            const required = [
                'id',
                'Orçamento',
                'Leads',
                'CPL',
                'CTR',
                'CPM',
                'Frequência',
                'Quantidade',
                'Mensagens_Enviadas',
                'Atendimento',
                'Reuniao_Marcada',
                'Reuniao_Realizada',
                'Vendas'
            ];

            required.forEach(col => console.log(`  - ${col}`));

            console.log('\n❌ Colunas faltando:');
            const missing = required.filter(col => !columns.includes(col));
            if (missing.length === 0) {
                console.log('  Nenhuma! Todas as colunas estão presentes.');
            } else {
                missing.forEach(col => console.log(`  - ${col}`));
            }

        } else {
            console.log('⚠️ Tabela Meta_2 está vazia. Não é possível verificar as colunas.');
            console.log('Por favor, adicione pelo menos uma linha ou verifique manualmente no Supabase.');
        }

        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('1. Acesse o Supabase Dashboard');
        console.log('2. Vá em SQL Editor');
        console.log('3. Execute o arquivo add_meta_columns.sql');
        console.log('4. Ou adicione as colunas manualmente via Table Editor');

    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
}

checkMeta2Columns();
