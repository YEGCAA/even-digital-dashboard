-- Script SQL para atualizar a tabela Meta_2
-- Execute este script no SQL Editor do Supabase para garantir que todas as colunas existam

-- 1. Adicionar coluna Config para salvar os modos (Diário/Mensal/Fixo)
ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Config" text DEFAULT '{}';

-- 2. Garantir colunas de métricas com nomes corretos (Plural é o padrão usado no App.tsx)
ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Mensagens_Enviadas" numeric DEFAULT 0;

ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Atendimento" numeric DEFAULT 0;

ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Reunioes_Marcadas" numeric DEFAULT 0;

ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Reunioes_Realizadas" numeric DEFAULT 0;

ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Vendas" numeric DEFAULT 0;

-- 3. Caso você tenha as colunas no singular, este comando ajuda a manter compatibilidade
-- (Opcional, o site agora tenta ler as duas formas)

-- Verificar as colunas após a execução
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Meta_2'
ORDER BY ordinal_position;
