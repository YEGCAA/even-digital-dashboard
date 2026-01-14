#!/bin/bash

# Script de setup para GitHub Pages
# Execute este script para configurar tudo automaticamente

echo "🚀 Configurando projeto para GitHub Pages..."
echo ""

# Verificar se já é um repositório Git
if [ -d .git ]; then
    echo "✅ Repositório Git já existe"
else
    echo "📦 Inicializando repositório Git..."
    git init
    echo "✅ Git inicializado"
fi

echo ""
echo "⚠️  ATENÇÃO: Você precisa criar um repositório no GitHub primeiro!"
echo ""
echo "1. Acesse: https://github.com/new"
echo "2. Crie um repositório público"
echo "3. Copie a URL do repositório"
echo ""

read -p "Cole a URL do repositório (ex: https://github.com/usuario/repo.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ URL não fornecida. Abortando."
    exit 1
fi

# Extrair nome do repositório da URL
REPO_NAME=$(echo $REPO_URL | sed 's/.*\/\([^\/]*\)\.git/\1/')

echo ""
echo "📝 Nome do repositório detectado: $REPO_NAME"
echo ""

# Atualizar vite.config.ts com o base path correto
echo "⚙️  Atualizando vite.config.ts..."

# Backup do arquivo original
cp vite.config.ts vite.config.ts.backup

# Substituir base path
sed -i "s|base: '\./\\'|base: '/$REPO_NAME/'|g" vite.config.ts

echo "✅ vite.config.ts atualizado com base: '/$REPO_NAME/'"

# Verificar se remote já existe
if git remote | grep -q "^origin$"; then
    echo "⚠️  Remote 'origin' já existe. Removendo..."
    git remote remove origin
fi

# Adicionar remote
echo "🔗 Conectando ao repositório remoto..."
git remote add origin $REPO_URL

# Adicionar todos os arquivos
echo "📦 Adicionando arquivos ao Git..."
git add .

# Fazer commit
echo "💾 Fazendo commit inicial..."
git commit -m "Initial commit: Even Digital Dashboard"

# Enviar para GitHub
echo "⬆️  Enviando para o GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Setup completo!"
echo ""
echo "🚀 Próximos passos:"
echo "1. Execute: npm install"
echo "2. Execute: npm run deploy"
echo "3. Ative GitHub Pages em: https://github.com/$(echo $REPO_URL | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/settings/pages"
echo "4. Selecione branch 'gh-pages' e salve"
echo ""
echo "🌐 Seu site estará em: https://$(echo $REPO_URL | sed 's/.*github.com[:/]\([^\/]*\)\/.*/\1/').github.io/$REPO_NAME/"
echo ""
