import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgvzfvuqzwdnhvxdxkxn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFndnpmdnVxendkbmh2eGR4a3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjI0MzAsImV4cCI6MjA1MjUzODQzMH0.xDlZnkKgDvkKMPMpqYTjdvWLlPjPMqJPFqNKBJNXZBU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColumns() {
    console.log('🔍 Verificando estrutura da tabela Meta_2...\n');

    try {
        // Tentar inserir um registro de teste com todas as colunas
        const testData = {
            Orçamento: 1000,
            Leads: 100,
            CPL: 10,
            CTR: 2.5,
            CPM: 15,
            Frequência: 3,
            Quantidade: 50,
            Mensagens_Enviadas: 80,
            Atendimento: 60,
            Reuniao_Marcada: 40,
            Reuniao_Realizada: 30,
            Vendas: 20
        };

        console.log('📝 Tentando inserir registro de teste...\n');

        const { data, error } = await supabase
            .from('Meta_2')
            .insert([testData])
            .select();

        if (error) {
            console.error('❌ Erro ao inserir:', error.message);
            console.error('Detalhes:', error);

            // Tentar descobrir qual coluna está faltando
            if (error.message.includes('column')) {
                console.log('\n💡 Parece que alguma coluna está com nome diferente.');
                console.log('Vou tentar buscar os dados existentes para ver as colunas...\n');

                const { data: existing, error: selectError } = await supabase
                    .from('Meta_2')
                    .select('*')
                    .limit(1);

                if (existing && existing.length > 0) {
                    console.log('✅ Colunas encontradas na tabela:');
                    Object.keys(existing[0]).forEach(col => console.log(`  - "${col}"`));
                } else if (selectError) {
                    console.error('❌ Erro ao buscar:', selectError.message);
                } else {
                    console.log('⚠️ Tabela vazia - não é possível verificar colunas');
                }
            }
        } else {
            console.log('✅ Sucesso! Registro inserido:');
            console.log(data);
            console.log('\n📋 Colunas confirmadas:');
            Object.keys(testData).forEach(col => console.log(`  ✓ ${col}`));

            // Deletar o registro de teste
            if (data && data[0]) {
                await supabase.from('Meta_2').delete().eq('id', data[0].id);
                console.log('\n🗑️ Registro de teste removido.');
            }
        }

    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
}

verifyColumns();
