# 📚 Documentação - Páginas do Assinante

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Páginas Implementadas](#páginas-implementadas)
3. [Rotas](#rotas)
4.  [Componentes Utilizados](#componentes-utilizados)
5. [Integrações com Backend](#integrações-com-backend)
6. [Fluxos Principais](#fluxos-principais)

---

## 🎯 Visão Geral

Este diretório contém **todas as 14 páginas** do lado do **assinante** da plataforma PrideConnect. 

### Páginas criadas:

✅ Feed. jsx - Feed personalizado  
✅ Explore.jsx - Explorar criadores  
✅ Trending.jsx - Conteúdo em alta  
✅ Favorites.jsx - Criadores favoritos  
✅ PostView.jsx - Visualização de post  
✅ CreatorProfile.jsx - Perfil do criador  
✅ Profile.jsx - Perfil do assinante  
✅ Settings.jsx - Configurações (6 tabs)  
✅ Subscriptions.jsx - Gerenciar assinaturas  
✅ Messages.jsx - Inbox de mensagens  
✅ Chat.jsx - Chat individual  
✅ Wallet.jsx - Carteira digital  
✅ Transactions.jsx - Histórico de transações  
✅ Notifications.jsx - Centro de notificações  

---

## 📄 Páginas Implementadas

### 1. **Feed.jsx**

**Propósito:** Feed personalizado com posts de criadores seguidos

**Features:**
- ✅ Infinite scroll
- ✅ Filtros por tipo de conteúdo (Todos, Fotos, Vídeos, Lives)
- ✅ Refresh manual
- ✅ Curtir posts
- ✅ Desbloquear PPV
- ✅ Empty state com CTA para explorar

**APIs utilizadas:**
```javascript
GET /api/posts/feed?page=1&limit=20&type=photos
POST /api/posts/:id/like
POST /api/payments/ppv/post/:id
```

**Estado:**
```javascript
{
  posts: [],
  loading: boolean,
  hasMore: boolean,
  page: number,
  filter: 'all' | 'photos' | 'videos' | 'lives'
}
```

---

### 2. **Explore.jsx**

**Propósito:** Descobrir novos criadores

**Features:**
- ✅ Infinite scroll
- ✅ Ordenação (Populares, Novos, Menor Preço, Maior Preço)
- ✅ Filtros avançados (Verificados, Faixa de preço)
- ✅ Assinar criadores
- ✅ Grid responsivo

**APIs utilizadas:**
```javascript
GET /api/creators? page=1&sort=popular&verified=true&minPrice=0&maxPrice=100
POST /api/creators/:id/subscribe
DELETE /api/subscriptions/:id
```

---

### 3. **Trending.jsx**

**Propósito:** Conteúdo em alta

**Features:**
- ✅ Seletor de período (Hoje, Semana, Mês)
- ✅ Tabs (Posts, Criadores, Tags)
- ✅ Posts mais curtidos/comentados
- ✅ Criadores em alta
- ✅ Tags trending com contagem

**APIs utilizadas:**
```javascript
GET /api/posts/trending?period=24h
GET /api/creators/trending?period=7d
GET /api/tags/trending?period=30d
```

---

### 4. **Favorites.jsx**

**Propósito:** Criadores favoritados

**Features:**
- ✅ Lista de favoritos
- ✅ Ordenação (Recentes, A-Z, Mais Ativos)
- ✅ Desfavoritar com confirmação
- ✅ Empty state

**APIs utilizadas:**
```javascript
GET /api/favorites? sort=recent
DELETE /api/favorites/:creatorId
```

---

### 5. **PostView.jsx**

**Propósito:** Visualização completa de post

**Features:**
- ✅ Visualizar post completo
- ✅ Galeria de mídia (MediaViewer)
- ✅ Seção de comentários
- ✅ Curtir/descurtir
- ✅ Compartilhar
- ✅ PPV modal para desbloquear

**APIs utilizadas:**
```javascript
GET /api/posts/:id
POST /api/posts/:id/like
POST /api/posts/:id/comment
GET /api/posts/:id/comments
POST /api/payments/ppv/post/:id
```

---

### 6. **CreatorProfile.jsx**

**Propósito:** Perfil público do criador

**Features:**
- ✅ Cover + Avatar
- ✅ Bio e estatísticas
- ✅ Botão de assinar/gerenciar
- ✅ Favoritar
- ✅ Enviar mensagem
- ✅ Tabs (Posts, Sobre, Loja)
- ✅ Grid de posts (com infinite scroll)
- ✅ Conteúdo bloqueado se não assinante

**APIs utilizadas:**
```javascript
GET /api/creators/:username
GET /api/creators/:username/posts? page=1
POST /api/creators/:id/subscribe
DELETE /api/subscriptions/:id
POST /api/favorites/:id
DELETE /api/favorites/:id
```

---

### 7.  **Profile.jsx**

**Propósito:** Perfil do próprio assinante

**Features:**
- ✅ Editar nome e bio
- ✅ Upload de avatar e capa
- ✅ Estatísticas (Assinaturas, Favoritos, Total Gasto)
- ✅ Quick actions
- ✅ Data de cadastro

**APIs utilizadas:**
```javascript
GET /api/users/me
PUT /api/users/me (multipart/form-data)
```

---

### 8. **Settings.jsx**

**Propósito:** Configurações completas (6 tabs)

**Tabs:**

**A) Informações Pessoais**
- Nome, Username (read-only), Email, Data de nascimento, Bio

**B) Privacidade e Segurança**
- Alterar senha
- Validação de senha forte

**C) Notificações**
- Toggles para cada tipo de notificação
- Email, Push, Posts, Mensagens, etc.

**D) Métodos de Pagamento**
- Listar métodos salvos
- Adicionar/remover

**E) Assinaturas**
- Redirect para /subscriptions

**F) Histórico de Compras**
- Redirect para /transactions

**APIs utilizadas:**
```javascript
GET /api/users/settings
PUT /api/users/me
PUT /api/users/change-password
PUT /api/users/notification-settings
GET /api/payments/methods
DELETE /api/payments/methods/:id
```

---

### 9. **Subscriptions.jsx**

**Propósito:** Gerenciar assinaturas

**Features:**
- ✅ Filtros (Ativas, Pausadas, Canceladas, Todas)
- ✅ Cancelar assinatura com modal de confirmação
- ✅ Pausar assinatura
- ✅ Ver perfil do criador
- ✅ Enviar mensagem
- ✅ Próxima data de cobrança

**APIs utilizadas:**
```javascript
GET /api/subscriptions? status=active
DELETE /api/subscriptions/:id
PUT /api/subscriptions/:id/pause
```

---

### 10. **Messages.jsx**

**Propósito:** Inbox de mensagens

**Features:**
- ✅ Lista de conversas
- ✅ Busca por criador
- ✅ Indicador de online/offline (Socket.io)
- ✅ Badge de não lidas
- ✅ Preview da última mensagem
- ✅ Indicador de PPV
- ✅ Real-time updates

**APIs utilizadas:**
```javascript
GET /api/messages
```

**Socket events:**
```javascript
socket.on('new_message', handleNewMessage);
```

---

### 11. **Chat.jsx**

**Propósito:** Chat individual com criador

**Features:**
- ✅ Chat em tempo real (Socket.io)
- ✅ Enviar texto e imagens
- ✅ Indicador de "digitando..."
- ✅ Status online/offline
- ✅ Mensagens PPV bloqueadas
- ✅ Modal PPV para desbloquear
- ✅ Auto-scroll para última mensagem

**APIs utilizadas:**
```javascript
GET /api/messages/:userId
POST /api/messages
POST /api/payments/ppv/message/:id
```

**Socket events:**
```javascript
socket.emit('typing', { recipientId });
socket.emit('stop_typing', { recipientId });
socket.on('new_message', handleNewMessage);
socket.on('typing', handleTyping);
socket.on('stop_typing', handleStopTyping);
```

---

### 12. **Wallet. jsx**

**Propósito:** Carteira digital e visão geral de gastos

**Features:**
- ✅ Seletor de período (Semana, Mês, Ano)
- ✅ Cards de estatísticas (Total gasto, Média mensal, Total all-time)
- ✅ Distribuição de gastos (gráfico de barras)
- ✅ Top 5 criadores com maior gasto
- ✅ Transações recentes
- ✅ Quick actions

**APIs utilizadas:**
```javascript
GET /api/wallet? period=month
```

---

### 13. **Transactions.jsx**

**Propósito:** Histórico completo de transações

**Features:**
- ✅ Infinite scroll
- ✅ Filtros avançados (Tipo, Status, Data)
- ✅ Exportar CSV
- ✅ Detalhes expandidos
- ✅ Download de recibos
- ✅ Link para conteúdo relacionado

**APIs utilizadas:**
```javascript
GET /api/transactions? page=1&type=subscription&status=completed&startDate=2025-01-01
GET /api/transactions/export (blob)
```

---

### 14. **Notifications.jsx**

**Propósito:** Centro de notificações

**Features:**
- ✅ Lista completa de notificações
- ✅ Filtro (Todas, Não lidas)
- ✅ Marcar como lida (individual)
- ✅ Marcar todas como lidas
- ✅ Load more (infinite scroll)
- ✅ Navegação ao clicar
- ✅ Real-time updates

**APIs utilizadas:**
```javascript
GET /api/notifications? page=1
PUT /api/notifications/:id/read
PUT /api/notifications/read-all
```

---

## 🛣️ Rotas

Configure no `App.jsx` ou `router.jsx`:

```jsx
import SubscriberLayout from './components/layout/SubscriberLayout';
import Feed from './pages/subscriber/Feed';
import Explore from './pages/subscriber/Explore';
// ... import all pages

<Route element={<SubscriberLayout user={user} onLogout={handleLogout} />}>
  <Route path="/feed" element={<Feed />} />
  <Route path="/explore" element={<Explore />} />
  <Route path="/trending" element={<Trending />} />
  <Route path="/favorites" element={<Favorites />} />
  <Route path="/post/:postId" element={<PostView />} />
  <Route path="/creator/:username" element={<CreatorProfile />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/subscriptions" element={<Subscriptions />} />
  <Route path="/messages" element={<Messages />} />
  <Route path="/messages/:userId" element={<Chat />} />
  <Route path="/wallet" element={<Wallet />} />
  <Route path="/transactions" element={<Transactions />} />
  <Route path="/notifications" element={<Notifications />} />
</Route>
```

---

## 🧩 Componentes Utilizados

Todas as páginas utilizam os componentes criados em `/components/subscriber`:

- **PostCard** - Feed, PostView, CreatorProfile, Trending
- **CreatorCard** - Explore, Trending, Favorites
- **PPVModal** - PostView, Chat
- **MediaViewer** - PostView
- **CommentSection** - PostView
- **SubscriptionCard** - Subscriptions
- **TransactionRow** - Transactions, Wallet
- **NotificationItem** - Notifications
- **SearchBar** - Messages, Explore
- **FilterBar** - Feed, Explore

---

## 🔌 Integrações com Backend

### Endpoints Necessários

Certifique-se de que o backend implementa:

```
# Posts
GET    /api/posts/feed
GET    /api/posts/:id
GET    /api/posts/trending
POST   /api/posts/:id/like
POST   /api/posts/:id/comment
GET    /api/posts/:id/comments

# Creators
GET    /api/creators
GET    /api/creators/:username
GET    /api/creators/:username/posts
GET    /api/creators/trending
POST   /api/creators/:id/subscribe

# Subscriptions
GET    /api/subscriptions
DELETE /api/subscriptions/:id
PUT    /api/subscriptions/:id/pause

# Favorites
GET    /api/favorites
POST   /api/favorites/:id
DELETE /api/favorites/:id

# Messages
GET    /api/messages
GET    /api/messages/:userId
POST   /api/messages

# Payments
POST   /api/payments/ppv/post/:id
POST   /api/payments/ppv/message/:id
GET    /api/payments/methods
DELETE /api/payments/methods/:id

# Wallet & Transactions
GET    /api/wallet
GET    /api/transactions
GET    /api/transactions/export

# Notifications
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all

# User
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/settings
PUT    /api/users/change-password
PUT    /api/users/notification-settings
```

### Socket.io Events

```javascript
// Emit
socket.emit('typing', { recipientId });
socket.emit('stop_typing', { recipientId });
socket.emit('join_chat', { userId });
socket.emit('leave_chat', { userId });

// Listen
socket.on('new_message', callback);
socket.on('new_notification', callback);
socket.on('typing', callback);
socket.on('stop_typing', callback);
socket.on('online_users', callback);
```

---

## 🔄 Fluxos Principais

### Fluxo 1: Assinar Criador

1.  Usuário acessa `/explore`
2. Clica em "Assinar" no CreatorCard
3. Modal de pagamento (se necessário)
4. POST `/api/creators/:id/subscribe`
5.  Redirecionado para perfil do criador
6. Agora pode ver conteúdo exclusivo

### Fluxo 2: Desbloquear Post PPV

1. Usuário vê post no feed com lock
2. Clica em "Desbloquear"
3. PPVModal abre
4. Seleciona método de pagamento
5. POST `/api/payments/ppv/post/:id`
6. Post é desbloqueado localmente
7. Pode visualizar conteúdo completo

### Fluxo 3: Conversar com Criador

1.  Usuário acessa `/messages`
2. Clica em conversa (ou busca criador)
3. Abre `/messages/:userId` (Chat)
4. Socket. io conecta automaticamente
5. Envia mensagem → POST `/api/messages`
6.  Criador recebe em tempo real
7. Indicador de "digitando..." funciona via socket

### Fluxo 4: Ver Gastos

1. Usuário acessa `/wallet`
2.  Seleciona período (Semana/Mês/Ano)
3. GET `/api/wallet?period=month`
4. Vê estatísticas e gráficos
5. Clica em "Ver Histórico Completo"
6. Abre `/transactions`
7. Pode filtrar e exportar CSV

---

## 🎨 Padrões de Código

### Estrutura de uma Página

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

const PageName = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pride_connect_token');
      const response = await axios.get(`${API_BASE_URL}/endpoint`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Content */}
    </div>
  );
};

export default PageName;
```

---

## ✅ Checklist de Implementação

- [x] Todas as 14 páginas criadas
- [x] Rotas configuradas
- [x] Componentes integrados
- [x] APIs conectadas
- [x] Socket. io configurado
- [x] Infinite scroll implementado
- [x] Filtros funcionando
- [x] PPV modal integrado
- [x] Loading states
- [x] Empty states
- [x] Error handling
- [x] Responsivo
- [x] Dark mode support

---

## 📞 Suporte

Se encontrar problemas:

1.  Verifique se o backend está rodando
2.  Verifique se o token está válido
3. Verifique se o Socket.io está conectado
4. Verifique console logs para erros
5. Verifique network tab para requisições

---

**🎉 Sistema Completo de Assinante Implementado! **
