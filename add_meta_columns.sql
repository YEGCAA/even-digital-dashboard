-- Script SQL para adicionar as 5 novas colunas na tabela Meta_2
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna Mensagens_Enviadas
ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Mensagens_Enviadas" numeric DEFAULT 0;

-- Adicionar coluna Atendimento
ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Atendimento" numeric DEFAULT 0;

-- Adicionar coluna Reuniao_Marcada
ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Reuniao_Marcada" numeric DEFAULT 0;

-- Adicionar coluna Reuniao_Realizada
ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Reuniao_Realizada" numeric DEFAULT 0;

-- Adicionar coluna Vendas
ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Vendas" numeric DEFAULT 0;

-- Verificar as colunas criadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Meta_2'
ORDER BY ordinal_position;
