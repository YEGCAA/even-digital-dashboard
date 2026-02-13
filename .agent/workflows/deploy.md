---
description: Deploy da aplicação para GitHub Pages
---

# Workflow de Deploy

Este workflow faz o deploy da aplicação para o GitHub Pages.

## Pré-requisitos

1. Certifique-se de que todas as alterações estão commitadas
2. Verifique se o arquivo `.env.local` está configurado corretamente (não será incluído no deploy)
3. Certifique-se de que o repositório Git está configurado

## Passos para Deploy

// turbo-all

1. **Verificar status do Git**
```bash
git status
```

2. **Adicionar todas as alterações (se houver)**
```bash
git add .
```

3. **Fazer commit das alterações (se houver)**
```bash
git commit -m "Update: preparando para deploy"
```

4. **Fazer push para o repositório remoto**
```bash
git push origin main
```

5. **Executar o build e deploy**
```bash
npm run deploy
```

## O que acontece durante o deploy?

- O Vite faz o build da aplicação (compila TypeScript, otimiza assets, etc.)
- Os arquivos são gerados na pasta `dist/`
- O `gh-pages` publica o conteúdo da pasta `dist/` no branch `gh-pages`
- O GitHub Pages serve a aplicação automaticamente

## Notas Importantes

- **Variáveis de ambiente**: As chaves da API (Supabase, Gemini, OpenAI) definidas em `.env.local` são injetadas durante o build
- **Base path**: Configurado como `./` para funcionar em qualquer subdiretório
- **CORS**: Certifique-se de que o Supabase está configurado para aceitar requisições do domínio do GitHub Pages

## Verificação pós-deploy

Após o deploy, acesse a URL do GitHub Pages para verificar se tudo está funcionando:
- Normalmente será: `https://<seu-usuario>.github.io/<nome-do-repositorio>/`
- Ou se configurado: `clientes.evendigital.com.br/gestao/`
