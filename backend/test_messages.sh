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

echo "Response: $REGISTER_RESPONSE"
echo ""

# Extrair ID e token
SUBSCRIBER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
SUBSCRIBER_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)

# Se não tiver token na resposta, tentar accessToken
if [ -z "$SUBSCRIBER_TOKEN" ]; then
  SUBSCRIBER_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | head -1 | cut -d'"' -f4)
fi

if [ -z "$SUBSCRIBER_ID" ] || [ -z "$SUBSCRIBER_TOKEN" ]; then
  echo "❌ Erro ao criar usuário!"
  echo "ID: $SUBSCRIBER_ID"
  echo "Token: $SUBSCRIBER_TOKEN"
  exit 1
fi

echo "✅ Assinante criado!"
echo "   ID: $SUBSCRIBER_ID"
echo "   Token: ${SUBSCRIBER_TOKEN:0:30}..."
echo ""

# 2. Criar conversa
echo "💬 2. Criando conversa com Pislon..."
CREATOR_ID="76bc0c49-f95b-4bd7-bbeb-57178e6cd975"

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
      "text": "🎉 Olá Pislon! Mensagem de teste enviada às '$(date +%H:%M:%S)'!  Sou seu novo assinante! 💜"
    }
  }')

echo "Mensagem response: $MESSAGE_RESPONSE"
echo ""

echo "✅ Mensagem enviada!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 AGORA OLHE NO FRONTEND:"
echo "   http://localhost:5173/creator/messages"
echo ""
echo "📊 Detalhes:"
echo "   Assinante: $SUBSCRIBER_ID"
echo "   Conversa: $CONVERSATION_ID"
echo "   Email: teste${TIMESTAMP}@example.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
