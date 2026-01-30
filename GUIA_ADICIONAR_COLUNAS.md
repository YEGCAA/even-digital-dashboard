# Guia: Adicionar Colunas na Tabela Meta_2 do Supabase

## Método 1: Via SQL Editor (RECOMENDADO - Mais Rápido)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Cole o seguinte código SQL:

```sql
-- Adicionar as 5 novas colunas
ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Mensagens_Enviadas" numeric DEFAULT 0;

ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Atendimento" numeric DEFAULT 0;

ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Reuniao_Marcada" numeric DEFAULT 0;

ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Reuniao_Realizada" numeric DEFAULT 0;

ALTER TABLE "Meta_2" 
ADD COLUMN IF NOT EXISTS "Vendas" numeric DEFAULT 0;
```

6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Você deve ver a mensagem "Success. No rows returned"

## Método 2: Via Table Editor (Manual)

1. Acesse o Supabase Dashboard
2. No menu lateral, clique em **Table Editor**
3. Selecione a tabela **Meta_2**
4. Clique no botão **+** (Add Column) no canto superior direito
5. Para cada coluna abaixo, preencha:

### Coluna 1: Mensagens_Enviadas
- **Name**: `Mensagens_Enviadas`
- **Type**: `numeric` ou `float8`
- **Default Value**: `0`
- **Is Nullable**: ✅ (marcado)
- Clique em **Save**

### Coluna 2: Atendimento
- **Name**: `Atendimento`
- **Type**: `numeric` ou `float8`
- **Default Value**: `0`
- **Is Nullable**: ✅ (marcado)
- Clique em **Save**

### Coluna 3: Reuniao_Marcada
- **Name**: `Reuniao_Marcada`
- **Type**: `numeric` ou `float8`
- **Default Value**: `0`
- **Is Nullable**: ✅ (marcado)
- Clique em **Save**

### Coluna 4: Reuniao_Realizada
- **Name**: `Reuniao_Realizada`
- **Type**: `numeric` ou `float8`
- **Default Value**: `0`
- **Is Nullable**: ✅ (marcado)
- Clique em **Save**

### Coluna 5: Vendas
- **Name**: `Vendas`
- **Type**: `numeric` ou `float8`
- **Default Value**: `0`
- **Is Nullable**: ✅ (marcado)
- Clique em **Save**

## Verificação

Após adicionar as colunas:

1. Vá em **Table Editor** → **Meta_2**
2. Verifique se as 5 novas colunas aparecem na lista
3. Apague todas as linhas antigas da tabela (se houver)
4. Teste no localhost novamente

## Estrutura Final da Tabela Meta_2

A tabela deve ter as seguintes colunas:

1. id (primary key)
2. Orçamento
3. Leads
4. CPL
5. CTR
6. CPM
7. Frequência
8. Quantidade
9. **Mensagens_Enviadas** (NOVA)
10. **Atendimento** (NOVA)
11. **Reuniao_Marcada** (NOVA)
12. **Reuniao_Realizada** (NOVA)
13. **Vendas** (NOVA)

## Após Criar as Colunas

1. Apague as linhas antigas da tabela Meta_2
2. Teste no localhost (http://localhost:3000)
3. Vá na aba "Metas"
4. Preencha os valores
5. Clique em "Adicionar Nova"
6. Verifique se salvou corretamente no Supabase

## Solução de Problemas

Se ainda der erro:
- Verifique se os nomes das colunas estão EXATAMENTE como especificado (com underscores)
- Certifique-se de que não há espaços nos nomes
- Verifique se o tipo é `numeric` ou `float8`
- Tente fazer um "Refresh" no schema cache do Supabase (Settings → Database → Refresh)
