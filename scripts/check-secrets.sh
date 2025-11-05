#!/bin/bash

# Script para verificar se há arquivos sensíveis no histórico do git

echo "🔍 Verificando arquivos sensíveis no histórico do git..."
echo ""

# Verificar arquivos .env
echo "📄 Verificando arquivos .env:"
git log --all --full-history --source --name-only --pretty=format: -- .env .env.local .env.production .env.development | sort -u | grep -v "^$"

echo ""
echo "📝 Verificando conteúdo de commits com 'password' ou 'secret':"
git log --all -S "password" --oneline --source | head -10

echo ""
echo "📝 Verificando conteúdo de commits com DATABASE_URL:"
git log --all -S "DATABASE_URL" --oneline --source | head -10

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "Se encontrar arquivos sensíveis, consulte SECURITY.md para instruções de remoção."

