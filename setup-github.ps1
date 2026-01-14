# Script PowerShell para setup do GitHub Pages
# Execute: .\setup-github.ps1

Write-Host "🚀 Configurando projeto para GitHub Pages..." -ForegroundColor Cyan
Write-Host ""

# Verificar se já é um repositório Git
if (Test-Path .git) {
    Write-Host "✅ Repositório Git já existe" -ForegroundColor Green
} else {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git inicializado" -ForegroundColor Green
}

Write-Host ""
Write-Host "⚠️  ATENÇÃO: Você precisa criar um repositório no GitHub primeiro!" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Acesse: https://github.com/new"
Write-Host "2. Crie um repositório público"
Write-Host "3. Copie a URL do repositório"
Write-Host ""

$REPO_URL = Read-Host "Cole a URL do repositório (ex: https://github.com/usuario/repo.git)"

if ([string]::IsNullOrWhiteSpace($REPO_URL)) {
    Write-Host "❌ URL não fornecida. Abortando." -ForegroundColor Red
    exit 1
}

# Extrair nome do repositório da URL
if ($REPO_URL -match '([^/]+)\.git$') {
    $REPO_NAME = $matches[1]
} elseif ($REPO_URL -match '([^/]+)$') {
    $REPO_NAME = $matches[1]
} else {
    Write-Host "❌ Não foi possível extrair o nome do repositório da URL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Nome do repositório detectado: $REPO_NAME" -ForegroundColor Cyan
Write-Host ""

# Atualizar vite.config.ts com o base path correto
Write-Host "⚙️  Atualizando vite.config.ts..." -ForegroundColor Yellow

# Ler o arquivo
$configContent = Get-Content "vite.config.ts" -Raw

# Substituir base path
$configContent = $configContent -replace "base: '\./\'", "base: '/$REPO_NAME/'"

# Salvar
Set-Content "vite.config.ts" -Value $configContent

Write-Host "✅ vite.config.ts atualizado com base: '/$REPO_NAME/'" -ForegroundColor Green

# Verificar se remote já existe
$remotes = git remote
if ($remotes -contains "origin") {
    Write-Host "⚠️  Remote 'origin' já existe. Removendo..." -ForegroundColor Yellow
    git remote remove origin
}

# Adicionar remote
Write-Host "🔗 Conectando ao repositório remoto..." -ForegroundColor Yellow
git remote add origin $REPO_URL

# Adicionar todos os arquivos
Write-Host "📦 Adicionando arquivos ao Git..." -ForegroundColor Yellow
git add .

# Fazer commit
Write-Host "💾 Fazendo commit inicial..." -ForegroundColor Yellow
git commit -m "Initial commit: Even Digital Dashboard"

# Enviar para GitHub
Write-Host "⬆️  Enviando para o GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "✅ Setup completo!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: npm install"
Write-Host "2. Execute: npm run deploy"

# Extrair usuário da URL
if ($REPO_URL -match 'github\.com[:/]([^/]+)/') {
    $GITHUB_USER = $matches[1]
    Write-Host "3. Ative GitHub Pages em: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
    Write-Host "4. Selecione branch 'gh-pages' e salve"
    Write-Host ""
    Write-Host "🌐 Seu site estará em: https://$GITHUB_USER.github.io/$REPO_NAME/" -ForegroundColor Green
}

Write-Host ""
