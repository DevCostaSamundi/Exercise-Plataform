#!/bin/bash

echo "🧪 Testando Sistema de Mensagens..."
echo ""

# 1. Criar novo usuário
echo "📝 1. Criando novo assinante..."
TIMESTAMP=$(date +%s)

REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste'$TIMESTAMP'@example.com",
    "username": "teste'$TIMESTAMP'",
    "password": "Senha123",
    "confirmPassword": "Senha123",
    "displayName": "Teste User",
    "birthDate": "1995-05-15",
    "genderIdentity": "Cis homem",
    "orientation": "Gay",
    "agreeTerms": true,
    "ageConfirm": true
  }')

echo "Response resumido: $(echo $REGISTER_RESPONSE | cut -c1-200)..."
echo ""

# Extrair ID e token
SUBSCRIBER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
SUBSCRIBER_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$SUBSCRIBER_ID" ] || [ -z "$SUBSCRIBER_TOKEN" ]; then
  echo "❌ Erro ao criar usuário!"
  echo "ID: $SUBSCRIBER_ID"
  echo "Token: $SUBSCRIBER_TOKEN"
  exit 1
fi

echo "✅ Assinante criado!"
echo "   ID: $SUBSCRIBER_ID"
echo "   Email: teste${TIMESTAMP}@example.com"
echo ""

# 2. Criar conversa
echo "💬 2. Criando conversa com Pislon..."
CREATOR_ID="76bc0c49-f95b-4bd7-bbeb-57178e6cd975"

# ⚠️ CORREÇÃO: Adicionar /api na URL
CONV_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/messages/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUBSCRIBER_TOKEN" \
  -d '{
    "recipientId": "'$CREATOR_ID'"
  }')

echo "Conversa response: $CONV_RESPONSE"
echo ""

CONVERSATION_ID=$(echo $CONV_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$CONVERSATION_ID" ]; then
  echo "❌ Erro ao criar conversa!"
  echo "Response completo: $CONV_RESPONSE"
  exit 1
fi

echo "✅ Conversa criada!"
echo "   ID: $CONVERSATION_ID"
echo ""

# 3. Enviar mensagem
echo "📨 3. Enviando mensagem..."
MESSAGE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUBSCRIBER_TOKEN" \
  -d '{
    "conversationId": "'$CONVERSATION_ID'",
    "recipientId": "'$CREATOR_ID'",
    "type": "text",
    "content": {
      "text": "Sou eu mesmo! Mensagem de teste enviada às '$(date +%H:%M:%S)'!  Eu amo voce!  💜"
    }
  }')

echo "Mensagem response: $(echo $MESSAGE_RESPONSE | cut -c1-150)..."
echo ""

echo "✅ Teste completo!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 AGORA RECARREGUE O FRONTEND:"
echo "   http://localhost:5173/creator/messages"
echo ""
echo "📊 Detalhes:"
echo "   Assinante: teste${TIMESTAMP}@example.com"
echo "   Assinante ID: $SUBSCRIBER_ID"
echo "   Conversa ID: $CONVERSATION_ID"
echo "   Criador (Pislon): $CREATOR_ID"
echo ""
echo "🔑 Token para debug:"
echo "   $SUBSCRIBER_TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
