import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas!');
    console.log('Certifique-se de ter VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumnsToMeta2() {
    console.log('🔧 Adicionando colunas à tabela Meta_2...\n');

    const sqlCommands = [
        'ALTER TABLE "Meta_2" ADD COLUMN IF NOT EXISTS "Mensagens_Enviadas" numeric DEFAULT 0;',
        'ALTER TABLE "Meta_2" ADD COLUMN IF NOT EXISTS "Atendimento" numeric DEFAULT 0;',
        'ALTER TABLE "Meta_2" ADD COLUMN IF NOT EXISTS "Reuniao_Marcada" numeric DEFAULT 0;',
        'ALTER TABLE "Meta_2" ADD COLUMN IF NOT EXISTS "Reuniao_Realizada" numeric DEFAULT 0;',
        'ALTER TABLE "Meta_2" ADD COLUMN IF NOT EXISTS "Vendas" numeric DEFAULT 0;'
    ];

    try {
        for (const sql of sqlCommands) {
            console.log(`Executando: ${sql}`);
            const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

            if (error) {
                console.error(`❌ Erro: ${error.message}`);
            } else {
                console.log('✅ Sucesso!');
            }
        }

        console.log('\n🎉 Processo concluído!');
        console.log('\n📋 Verificando estrutura da tabela...');

        const { data, error } = await supabase
            .from('Meta_2')
            .select('*')
            .limit(1);

        if (data && data.length > 0) {
            console.log('\n✅ Colunas disponíveis:');
            console.log(Object.keys(data[0]));
        } else if (!error) {
            console.log('\n⚠️ Tabela vazia - colunas foram criadas mas não há dados para verificar');
        }

    } catch (err) {
        console.error('❌ Erro ao executar comandos:', err.message);
        console.log('\n💡 SOLUÇÃO ALTERNATIVA:');
        console.log('Execute o arquivo add_meta_columns.sql manualmente no SQL Editor do Supabase');
    }
}

addColumnsToMeta2();
