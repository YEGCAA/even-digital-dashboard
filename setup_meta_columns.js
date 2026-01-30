import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupMetaColumns() {
    console.log('🔍 Verificando estrutura da tabela Meta_2...\n');

    try {
        // Tentar fazer uma query simples para verificar as colunas existentes
        const { data, error } = await supabase
            .from('Meta_2')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Erro ao acessar Meta_2:', error.message);
            return;
        }

        console.log('✅ Tabela Meta_2 acessível!');

        if (data && data.length > 0) {
            console.log('\n📋 Colunas existentes na primeira linha:');
            console.log(Object.keys(data[0]));
        } else {
            console.log('\n⚠️ Tabela vazia - não é possível verificar colunas');
        }

        console.log('\n📝 Colunas necessárias:');
        const requiredColumns = [
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

        console.log(requiredColumns);

        console.log('\n💡 IMPORTANTE:');
        console.log('As colunas devem ser criadas manualmente no Supabase com os seguintes nomes:');
        console.log('- Mensagens_Enviadas (tipo: numeric ou float8)');
        console.log('- Atendimento (tipo: numeric ou float8)');
        console.log('- Reuniao_Marcada (tipo: numeric ou float8)');
        console.log('- Reuniao_Realizada (tipo: numeric ou float8)');
        console.log('- Vendas (tipo: numeric ou float8)');
        console.log('\nOu use underscores ao invés de espaços nos nomes das colunas.');

    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
}

setupMetaColumns();
