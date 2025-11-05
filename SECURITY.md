# Guia de Segurança - Remover Credenciais do Git

## ⚠️ IMPORTANTE: Se você já commitou credenciais no git

Se você acidentalmente commitou arquivos `.env` ou credenciais no histórico do git, siga estes passos:

### Opção 1: Usando git filter-branch (Método tradicional)

```bash
# Remover arquivo específico do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.local .env.production" \
  --prune-empty --tag-name-filter cat -- --all

# Forçar push (CUIDADO: isso reescreve o histórico)
git push origin --force --all
git push origin --force --tags
```

### Opção 2: Usando BFG Repo-Cleaner (Recomendado - mais rápido)

1. Baixe o BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Execute:

```bash
# Remover arquivos específicos
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --delete-files .env.local
java -jar bfg.jar --delete-files .env.production

# Limpar repositório
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Forçar push
git push origin --force --all
```

### Opção 3: Usando git filter-repo (Mais moderno)

```bash
# Instalar git-filter-repo primeiro
pip install git-filter-repo

# Remover arquivos do histórico
git filter-repo --path .env --invert-paths
git filter-repo --path .env.local --invert-paths
git filter-repo --path .env.production --invert-paths

# Forçar push
git push origin --force --all
```

## 🔄 Após remover do histórico

1. **Regenere todas as chaves secretas:**
   - `JWT_SECRET`
   - `INVITE_SECRET`
   - Senhas do banco de dados
   - Qualquer outra credencial que possa ter sido exposta

2. **Atualize as variáveis no Render:**
   - Vá em Environment e atualize todas as variáveis de ambiente

3. **Notifique usuários (se necessário):**
   - Se tokens JWT foram expostos, todos os usuários precisarão fazer login novamente
   - Se senhas de banco foram expostas, considere mudar a senha do banco

## ✅ Verificação

Para verificar se ainda há arquivos sensíveis no histórico:

```bash
# Verificar histórico
git log --all --full-history --source -- .env .env.local .env.production

# Verificar conteúdo de commits
git log -p --all -- .env .env.local
```

## 🛡️ Prevenção

- ✅ `.gitignore` já está configurado para ignorar arquivos `.env*`
- ✅ Código agora exige variáveis de ambiente em produção
- ✅ Valores padrão só funcionam em desenvolvimento com avisos

## 📝 Nota

**AVISO:** Remover arquivos do histórico do git é uma operação destrutiva. Certifique-se de:
1. Ter backup do repositório
2. Coordenar com a equipe (se houver)
3. Notificar colaboradores para fazer `git pull --rebase` após o push forçado

