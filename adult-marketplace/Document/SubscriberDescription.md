# 📚 Documentação Completa - Sistema de Assinantes PrideConnect

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Utilitários (Utils)](#utilitários-utils)
4. [Contextos (Contexts)](#contextos-contexts)
5. [Hooks Personalizados](#hooks-personalizados)
6. [Componentes Reutilizáveis](#componentes-reutilizáveis)
7. [Guia de Instalação](#guia-de-instalação)
8. [Guia de Uso](#guia-de-uso)
9. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

Este documento descreve **TODOS os arquivos criados** para o lado do **ASSINANTE** da plataforma **PrideConnect** - uma plataforma de conteúdo adulto LGBT+.

### O que foi implementado até agora:

✅ **3 Utilitários** - Formatação, validação e constantes  
✅ **2 Contextos** - Socket.io e Notificações  
✅ **4 Hooks** - Infinite scroll, debounce, socket e notificações  
✅ **10 Componentes** - Cards, modais, viewers e barras  

### O que FALTA implementar:

⏳ **4 Componentes de Layout** - Header, Sidebar, MobileNav, SubscriberLayout  
⏳ **14 Páginas** - Feed, Explore, Profile, Settings, Messages, etc.  
⏳ **1 README** - Documentação das páginas  

---

## 📁 Estrutura de Arquivos

```
adult-marketplace/src/
│
├── utils/                          # Utilitários
│   ├── formatters.js              ✅ Funções de formatação
│   ├── validators.js              ✅ Funções de validação
│   └── constants.js               ✅ Constantes da aplicação
│
├── contexts/                       # Contextos React
│   ├── SocketContext.jsx          ✅ Gerencia Socket.io
│   └── NotificationContext.jsx    ✅ Gerencia notificações
│
├── hooks/                          # Hooks personalizados
│   ├── useInfiniteScroll.js       ✅ Infinite scroll
│   ├── useDebounce.js             ✅ Debounce de valores
│   ├── useSocket.js               ✅ Re-export do Socket
│   └── useNotifications.js        ✅ Re-export das Notificações
│
├── components/
│   ├── subscriber/                # Componentes específicos
│   │   ├── PostCard.jsx           ✅ Card de post
│   │   ├── CreatorCard.jsx        ✅ Card de criador
│   │   ├── PPVModal.jsx           ✅ Modal de PPV
│   │   ├── MediaViewer.jsx        ✅ Visualizador de mídia
│   │   ├── CommentSection.jsx     ✅ Seção de comentários
│   │   ├── SubscriptionCard.jsx   ✅ Card de assinatura
│   │   ├── TransactionRow.jsx     ✅ Linha de transação
│   │   ├── NotificationItem.jsx   ✅ Item de notificação
│   │   ├── SearchBar.jsx          ✅ Barra de busca
│   │   └── FilterBar. jsx          ✅ Barra de filtros
│   │
│   └── layout/                    # Layout components
│       ├── Header. jsx             ⏳ Header principal
│       ├── Sidebar.jsx            ⏳ Sidebar desktop
│       ├── MobileNav.jsx          ⏳ Navegação mobile
│       └── SubscriberLayout.jsx   ⏳ Layout wrapper
│
└── pages/
    └── subscriber/                # Páginas
        ├── Feed.jsx               ⏳ Feed personalizado
        ├── Explore.jsx            ⏳ Explorar criadores
        ├── Trending.jsx           ⏳ Conteúdo em alta
        ├── Favorites.jsx          ⏳ Favoritos
        ├── PostView.jsx           ⏳ Visualizar post
        ├── CreatorProfile.jsx     ⏳ Perfil do criador
        ├── Profile.jsx            ⏳ Seu perfil
        ├── Settings.jsx           ⏳ Configurações
        ├── Subscriptions.jsx      ⏳ Assinaturas
        ├── Messages.jsx           ⏳ Inbox de mensagens
        ├── Chat.jsx               ⏳ Chat individual
        ├── Wallet.jsx             ⏳ Carteira digital
        ├── Transactions.jsx       ⏳ Histórico de transações
        ├── Notifications.jsx      ⏳ Centro de notificações
        └── README.md              ⏳ Documentação das páginas
```

---

## 🛠️ Utilitários (Utils)

### 1. `formatters.js` ✅

**Propósito:** Funções para formatação de dados (datas, valores, textos, etc.)

**Principais funções:**

| Função | Descrição | Exemplo |
|--------|-----------|---------|
| `formatCurrency(value)` | Formata valores em BRL | `formatCurrency(99. 90)` → "R$ 99,90" |
| `formatNumber(num)` | Formata números grandes | `formatNumber(1500)` → "1.5K" |
| `formatRelativeTime(date)` | Tempo relativo | `formatRelativeTime(date)` → "há 2 horas" |
| `formatDate(date, format)` | Formata data completa | `formatDate(date)` → "15 de janeiro de 2025, 14:30" |
| `truncateText(text, max)` | Trunca texto longo | `truncateText(".. .", 10)` → "... ..." |
| `formatUsername(username)` | Adiciona @ se necessário | `formatUsername("user")` → "@user" |
| `formatPhone(phone)` | Formata telefone BR | `formatPhone("11999999999")` → "(11) 99999-9999" |
| `formatCPF(cpf)` | Formata CPF | `formatCPF("12345678900")` → "123.456.789-00" |
| `formatFileSize(bytes)` | Tamanho de arquivo | `formatFileSize(1048576)` → "1 MB" |
| `formatDuration(seconds)` | Duração MM:SS | `formatDuration(125)` → "02:05" |
| `getInitials(name)` | Iniciais do nome | `getInitials("João Silva")` → "JS" |
| `pluralize(count, word)` | Pluraliza palavras | `pluralize(2, "item")` → "itens" |

**Dependências:**
- `date-fns` (formatação de datas)
- `date-fns/locale/pt-BR` (localização PT-BR)

**Exemplo de uso:**
```javascript
import { formatCurrency, formatRelativeTime } from '../utils/formatters';

const price = formatCurrency(49.90); // "R$ 49,90"
const time = formatRelativeTime(post.createdAt); // "há 3 horas"
```

---

### 2. `validators.js` ✅

**Propósito:** Funções para validação de dados (email, senha, CPF, arquivos, etc.)

**Principais funções:**

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `isValidEmail(email)` | `boolean` | Valida formato de email |
| `validatePassword(password)` | `{valid, errors[]}` | Valida senha (8+ chars, maiúsc, minúsc, número, especial) |
| `validateUsername(username)` | `{valid, error}` | Valida username (3-20 chars, alphanumeric + _) |
| `isValidCPF(cpf)` | `boolean` | Valida CPF brasileiro (com dígitos verificadores) |
| `isValidPhone(phone)` | `boolean` | Valida telefone BR (10 ou 11 dígitos) |
| `isValidURL(url)` | `boolean` | Valida URL |
| `isOver18(birthdate)` | `boolean` | Verifica se >= 18 anos |
| `validateImageFile(file, maxMB)` | `{valid, error}` | Valida imagem (JPG, PNG, GIF, WebP) |
| `validateVideoFile(file, maxMB)` | `{valid, error}` | Valida vídeo (MP4, WebM, OGG, MOV) |
| `validatePrice(value, min, max)` | `{valid, error}` | Valida valor monetário |
| `validateText(text, min, max)` | `{valid, error}` | Valida texto (tamanho) |

**Exemplo de uso:**
```javascript
import { isValidEmail, validatePassword } from '../utils/validators';

const emailValid = isValidEmail("user@example.com"); // true

const passwordCheck = validatePassword("Abc123!@");
// { valid: true, errors: [] }

const weakPassword = validatePassword("abc");
// { valid: false, errors: ["Senha deve ter no mínimo 8 caracteres", ... ] }
```

---

### 3. `constants.js` ✅

**Propósito:** Constantes centralizadas da aplicação

**Principais constantes:**

```javascript
// API & URLs
API_BASE_URL = 'http://localhost:5000/api'
SOCKET_URL = 'http://localhost:5000'

// Upload Limits
MAX_IMAGE_SIZE_MB = 5
MAX_VIDEO_SIZE_MB = 100
MAX_IMAGES_PER_POST = 10

// Enums
CONTENT_TYPES = { ALL, PHOTOS, VIDEOS, LIVES }
PAYMENT_STATUS = { PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED }
PAYMENT_METHODS = { PIX, CREDIT_CARD, CRYPTO }
TRANSACTION_TYPES = { SUBSCRIPTION, PPV_POST, PPV_MESSAGE, TIP }
SUBSCRIPTION_STATUS = { ACTIVE, CANCELLED, EXPIRED, PAUSED }
NOTIFICATION_TYPES = { NEW_POST, NEW_PPV, NEW_MESSAGE, ...  }

// UI
BREAKPOINTS = { MOBILE: 768, TABLET: 1024, DESKTOP: 1280 }
PAGE_SIZE = 20
TEXT_LIMITS = { BIO: 500, POST_CAPTION: 2000, ...  }

// Messages
ERROR_MESSAGES = { NETWORK_ERROR, UNAUTHORIZED, ...  }
SUCCESS_MESSAGES = { POST_LIKED, SUBSCRIBED, ... }

// Storage
STORAGE_KEYS = { AUTH_TOKEN, USER_DATA, THEME, LANGUAGE }
```

**Exemplo de uso:**
```javascript
import { API_BASE_URL, PAYMENT_STATUS } from '../utils/constants';

const url = `${API_BASE_URL}/posts`;
if (payment.status === PAYMENT_STATUS.COMPLETED) { ...  }
```

---

## 🔌 Contextos (Contexts)

### 1. `SocketContext.jsx` ✅

**Propósito:** Gerencia conexão Socket.io para funcionalidades real-time

**Features:**
- ✅ Conexão automática quando usuário autenticado
- ✅ Reconexão automática em caso de queda
- ✅ Lista de usuários online
- ✅ Eventos de digitando/parou de digitar
- ✅ Marcar mensagens como lidas
- ✅ Entrar/sair de salas de chat

**Valores fornecidos:**
```javascript
{
  socket,              // Instância do socket
  isConnected,         // Boolean - conexão ativa
  onlineUsers,         // Array - IDs dos usuários online
  isUserOnline(userId),// Function - verifica se usuário está online
  emitTyping(recipientId),
  emitStopTyping(recipientId),
  emitMessageRead(messageId, senderId),
  joinChatRoom(userId),
  leaveChatRoom(userId),
}
```

**Exemplo de uso:**
```javascript
import { SocketProvider } from './contexts/SocketContext';
import { useSocket } from './hooks/useSocket';

// No App.jsx
<SocketProvider user={currentUser}>
  <App />
</SocketProvider>

// Em um componente
const { isConnected, isUserOnline, emitTyping } = useSocket();

if (isUserOnline(creatorId)) {
  // Mostrar badge "online"
}

// Ao digitar
emitTyping(recipientId);
```

**Eventos Socket.io escutados:**
- `connect` - Quando conecta
- `disconnect` - Quando desconecta
- `connect_error` - Erros de conexão
- `online_users` - Atualização da lista de usuários online

---

### 2. `NotificationContext.jsx` ✅

**Propósito:** Gerencia notificações in-app e real-time

**Features:**
- ✅ Busca notificações do backend
- ✅ Recebe notificações real-time via Socket.io
- ✅ Marca como lida/não lida
- ✅ Marca todas como lidas
- ✅ Deleta notificações
- ✅ Infinite scroll (loadMore)
- ✅ Som de notificação
- ✅ Notificações do navegador (Browser API)

**Valores fornecidos:**
```javascript
{
  notifications,        // Array - lista de notificações
  unreadCount,          // Number - total não lidas
  loading,              // Boolean - carregando
  hasMore,              // Boolean - tem mais para carregar
  fetchNotifications(page, append),
  markAsRead(notificationId),
  markAllAsRead(),
  deleteNotification(notificationId),
  loadMore(),
  requestNotificationPermission(),
}
```

**Exemplo de uso:**
```javascript
import { NotificationProvider } from './contexts/NotificationContext';
import { useNotifications } from './hooks/useNotifications';

// No App.jsx (dentro do SocketProvider)
<NotificationProvider>
  <App />
</NotificationProvider>

// Em um componente
const { notifications, unreadCount, markAsRead } = useNotifications();

// Badge no header
<span className="badge">{unreadCount}</span>

// Marcar como lida ao clicar
onClick={() => markAsRead(notification._id)}
```

**Eventos Socket.io escutados:**
- `new_notification` - Nova notificação recebida

**Browser APIs usadas:**
- `Notification API` - Para notificações nativas do navegador
- `Audio API` - Para tocar som de notificação

---

## 🪝 Hooks Personalizados

### 1. `useInfiniteScroll.js` ✅

**Propósito:** Implementa infinite scroll em listas

**Parâmetros:**
```javascript
useInfiniteScroll(
  callback,    // Function - chamada ao chegar no fim
  hasMore,     // Boolean - se há mais conteúdo
  loading,     // Boolean - se está carregando
  threshold    // Number (0-1) - distância do fim para disparar
)
```

**Retorno:**
- `lastElementRef` - Ref para anexar ao último elemento da lista

**Exemplo de uso:**
```javascript
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    // Buscar mais posts
  };

  const lastPostRef = useInfiniteScroll(loadMore, hasMore, loading, 0. 8);

  return (
    <div>
      {posts.map((post, index) => {
        if (index === posts.length - 1) {
          return <PostCard ref={lastPostRef} key={post._id} post={post} />;
        }
        return <PostCard key={post._id} post={post} />;
      })}
    </div>
  );
};
```

**Como funciona:**
- Usa `IntersectionObserver` API
- Observa o último elemento da lista
- Quando o elemento entra na viewport (threshold), dispara callback
- Automaticamente desconecta observer durante loading

---

### 2. `useDebounce.js` ✅

**Propósito:** Debounce de valores (útil para buscas)

**Parâmetros:**
```javascript
useDebounce(
  value,   // Any - valor a ser debounced
  delay    // Number - delay em ms (padrão: 500)
)
```

**Retorno:**
- Valor debounced (atualizado após o delay)

**Exemplo de uso:**
```javascript
import useDebounce from '../hooks/useDebounce';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Fazer busca
      searchAPI(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
};
```

**Benefícios:**
- Reduz chamadas à API
- Melhora performance
- Melhor UX em campos de busca

---

### 3. `useSocket.js` ✅

**Propósito:** Re-export do hook do SocketContext

**Exemplo de uso:**
```javascript
import { useSocket } from '../hooks/useSocket';

const Chat = () => {
  const { socket, isConnected, emitTyping } = useSocket();
  
  // Usar socket
};
```

---

### 4. `useNotifications. js` ✅

**Propósito:** Re-export do hook do NotificationContext

**Exemplo de uso:**
```javascript
import { useNotifications } from '../hooks/useNotifications';

const NotificationBell = () => {
  const { unreadCount, notifications } = useNotifications();
  
  return <span>{unreadCount}</span>;
};
```

---

## 🧩 Componentes Reutilizáveis

### 1. `PostCard.jsx` ✅

**Propósito:** Card de post para exibição no feed

**Props:**
```javascript
{
  post: {
    _id,
    creator: { name, username, avatar, isVerified },
    caption,
    media: [{ type, url, thumbnail }],
    likes,
    commentsCount,
    isPPV,
    isUnlocked,
    price,
    createdAt,
    isLiked
  },
  onLike: (postId, isLiked) => {},
  onUnlock: (postId, paymentData) => {}
}
```

**Features:**
- ✅ Preview de mídia (imagem/vídeo)
- ✅ Blur para conteúdo PPV
- ✅ Botão de curtir com contador
- ✅ Contador de comentários
- ✅ Botão de compartilhar
- ✅ Link para perfil do criador
- ✅ Link para visualização completa do post
- ✅ Modal PPV integrado

**Exemplo de uso:**
```jsx
<PostCard
  post={post}
  onLike={handleLike}
  onUnlock={handleUnlockPPV}
/>
```

---

### 2. `CreatorCard.jsx` ✅

**Propósito:** Card de criador para página de exploração

**Props:**
```javascript
{
  creator: {
    _id,
    name,
    username,
    avatar,
    coverImage,
    bio,
    isVerified,
    likesCount,
    postsCount,
    subscribersCount,
    subscriptionPrice,
    previewPosts: [{ media }]
  },
  onSubscribe: (creatorId, isSubscribing) => {},
  isSubscribed: boolean
}
```

**Features:**
- ✅ Cover image + avatar
- ✅ Badge de verificação
- ✅ Bio truncada
- ✅ Estatísticas (curtidas, posts, assinantes)
- ✅ Botão de assinar com preço
- ✅ Preview de 3 posts (grid)
- ✅ Hover effect no grid

**Exemplo de uso:**
```jsx
<CreatorCard
  creator={creator}
  onSubscribe={handleSubscribe}
  isSubscribed={false}
/>
```

---

### 3. `PPVModal.jsx` ✅

**Propósito:** Modal para desbloquear conteúdo PPV

**Props:**
```javascript
{
  content: {
    type: 'post' | 'message',
    id,
    creator: { name, username, avatar },
    price,
    preview: { type, url, thumbnail },
    description
  },
  onClose: () => {},
  onUnlock: (paymentData) => {}
}
```

**Features:**
- ✅ Preview blur do conteúdo
- ✅ Informações do criador
- ✅ Seleção de método de pagamento (PIX, Cartão, Crypto)
- ✅ Validação e loading states
- ✅ Mensagens de erro
- ✅ Design responsivo

**Exemplo de uso:**
```jsx
{showPPVModal && (
  <PPVModal
    content={{
      type: 'post',
      id: post._id,
      creator: post.creator,
      price: post.price,
      preview: post.media[0],
      description: post. caption
    }}
    onClose={() => setShowPPVModal(false)}
    onUnlock={handleUnlock}
  />
)}
```

---

### 4. `MediaViewer.jsx` ✅

**Propósito:** Visualizador de mídia (galeria fullscreen)

**Props:**
```javascript
{
  media: [{ type: 'image'|'video', url, thumbnail }],
  initialIndex: number,
  onClose: () => {},
  allowDownload: boolean
}
```

**Features:**
- ✅ Visualização fullscreen
- ✅ Navegação entre mídias (setas ou keyboard)
- ✅ Thumbnail strip na parte inferior
- ✅ Player de vídeo com controles
- ✅ Zoom de imagens
- ✅ Download (opcional)
- ✅ Fechar com ESC ou botão X

**Exemplo de uso:**
```jsx
{showViewer && (
  <MediaViewer
    media={post.media}
    initialIndex={0}
    onClose={() => setShowViewer(false)}
    allowDownload={true}
  />
)}
```

---

### 5. `CommentSection.jsx` ✅

**Propósito:** Seção de comentários com replies

**Props:**
```javascript
{
  postId: string
}
```

**Features:**
- ✅ Lista de comentários
- ✅ Ordenação (Recentes/Populares)
- ✅ Input de novo comentário
- ✅ Replies aninhados
- ✅ Curtir comentários
- ✅ Responder comentários
- ✅ Avatar e nome do autor
- ✅ Timestamp relativo

**Exemplo de uso:**
```jsx
<CommentSection postId={post._id} />
```

---

### 6. `SubscriptionCard.jsx` ✅

**Propósito:** Card de assinatura ativa

**Props:**
```javascript
{
  subscription: {
    _id,
    creator: { _id, name, username, avatar, isVerified },
    price,
    status: 'active'|'paused'|'cancelled',
    nextBillingDate,
    startDate
  },
  onCancel: (subscriptionId) => {},
  onPause: (subscriptionId) => {}
}
```

**Features:**
- ✅ Avatar e nome do criador
- ✅ Badge de status (Ativa/Pausada/Cancelada)
- ✅ Preço mensal
- ✅ Próxima cobrança
- ✅ Data de início
- ✅ Botões: Ver Perfil, Mensagem, Pausar, Cancelar
- ✅ Modal de confirmação de cancelamento

**Exemplo de uso:**
```jsx
<SubscriptionCard
  subscription={subscription}
  onCancel={handleCancel}
  onPause={handlePause}
/>
```

---

### 7. `TransactionRow.jsx` ✅

**Propósito:** Linha expansível de transação

**Props:**
```javascript
{
  transaction: {
    _id,
    type: 'subscription'|'ppv_post'|'ppv_message'|'tip',
    amount,
    status: 'completed'|'pending'|'failed'|'refunded',
    paymentMethod: 'pix'|'credit_card'|'crypto',
    description,
    creator: { name, username },
    createdAt,
    refundedAt,
    relatedUrl
  }
}
```

**Features:**
- ✅ Informações principais (data, tipo, valor, status)
- ✅ Expansão para detalhes
- ✅ Badges coloridas de status
- ✅ Ícones de métodos de pagamento
- ✅ Botão de download de recibo
- ✅ Link para conteúdo relacionado

**Exemplo de uso:**
```jsx
<TransactionRow transaction={transaction} />
```

---

### 8. `NotificationItem.jsx` ✅

**Propósito:** Item de notificação individual

**Props:**
```javascript
{
  notification: {
    _id,
    type: 'new_post'|'new_ppv'|'new_message'|.. .,
    message,
    sender: { name, avatar },
    preview: { type, url, text },
    read,
    createdAt
  },
  onClick: (notification) => {}
}
```

**Features:**
- ✅ Ícone baseado no tipo
- ✅ Avatar do remetente
- ✅ Mensagem formatada
- ✅ Preview (imagem ou texto)
- ✅ Timestamp relativo
- ✅ Indicador de não lida
- ✅ Background diferente para não lidas

**Exemplo de uso:**
```jsx
<NotificationItem
  notification={notification}
  onClick={handleNotificationClick}
/>
```

---

### 9. `SearchBar.jsx` ✅

**Propósito:** Barra de busca com autocomplete

**Props:**
```javascript
{
  placeholder: string,
  autoFocus: boolean
}
```

**Features:**
- ✅ Debounce automático (500ms)
- ✅ Busca de criadores na API
- ✅ Dropdown de resultados
- ✅ Avatar e nome nos resultados
- ✅ Badge de verificação
- ✅ Click outside para fechar
- ✅ Limpar busca (botão X)
- ✅ Loading state

**Exemplo de uso:**
```jsx
<SearchBar
  placeholder="Buscar criadores..."
  autoFocus={false}
/>
```

---

### 10. `FilterBar.jsx` ✅

**Propósito:** Barra de filtros de conteúdo

**Props:**
```javascript
{
  activeFilter: 'all'|'photos'|'videos'|'lives',
  onFilterChange: (filter) => {},
  showAll: boolean
}
```

**Features:**
- ✅ Filtros: Todos, Fotos, Vídeos, Lives
- ✅ Ícones para cada tipo
- ✅ Destaque visual do filtro ativo
- ✅ Scroll horizontal no mobile

**Exemplo de uso:**
```jsx
<FilterBar
  activeFilter={filter}
  onFilterChange={setFilter}
  showAll={true}
/>
```

---

## 📦 Guia de Instalação

### Dependências necessárias:

```bash
npm install date-fns socket.io-client axios react-router-dom react-icons
```

**Detalhamento:**

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `date-fns` | ^3.0.0 | Formatação de datas |
| `socket.io-client` | ^4.5.0 | Conexão Socket.io real-time |
| `axios` | ^1.6.0 | Requisições HTTP |
| `react-router-dom` | ^6.20.0 | Roteamento |
| `react-icons` | ^5.0.0 | Ícones (Feather Icons) |

### Estrutura de pastas a criar:

```bash
mkdir -p adult-marketplace/src/utils
mkdir -p adult-marketplace/src/contexts
mkdir -p adult-marketplace/src/hooks
mkdir -p adult-marketplace/src/components/subscriber
mkdir -p adult-marketplace/src/components/layout
mkdir -p adult-marketplace/src/pages/subscriber
```

### Variáveis de ambiente (. env):

```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📖 Guia de Uso

### 1. Configurar Providers no App.jsx:

```jsx
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthContext } from './contexts/AuthContext'; // Assumindo que já existe

function App() {
  const { user } = useContext(AuthContext);

  return (
    <SocketProvider user={user}>
      <NotificationProvider>
        <Router>
          {/* Suas rotas */}
        </Router>
      </NotificationProvider>
    </SocketProvider>
  );
}
```

### 2.  Usar componentes nas páginas:

```jsx
// Exemplo: Página de Feed
import PostCard from '../components/subscriber/PostCard';
import FilterBar from '../components/subscriber/FilterBar';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const lastPostRef = useInfiniteScroll(loadMorePosts, hasMore, loading);

  const loadMorePosts = async () => {
    // Buscar posts da API
  };

  return (
    <div>
      <FilterBar activeFilter={filter} onFilterChange={setFilter} />
      
      <div className="space-y-4">
        {posts.map((post, index) => (
          <PostCard
            key={post._id}
            ref={index === posts.length - 1 ? lastPostRef : null}
            post={post}
            onLike={handleLike}
            onUnlock={handleUnlock}
          />
        ))}
      </div>
    </div>
  );
};
```

### 3. Usar formatters e validators:

```jsx
import { formatCurrency, formatRelativeTime } from '../utils/formatters';
import { isValidEmail } from '../utils/validators';

// Em um componente
const price = formatCurrency(subscription.price);
const time = formatRelativeTime(post.createdAt);

// Em um form
const emailValid = isValidEmail(email);
if (! emailValid) {
  setError('Email inválido');
}
```

### 4. Usar Socket e Notifications:

```jsx
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from '../hooks/useNotifications';

const Chat = () => {
  const { socket, isConnected, emitTyping } = useSocket();
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('new_message', handleNewMessage);
      return () => socket.off('new_message');
    }
  }, [socket, isConnected]);

  const handleTyping = () => {
    emitTyping(recipientId);
  };

  return (
    <div>
      <span>Notificações: {unreadCount}</span>
      {/* Chat UI */}
    </div>
  );
};
```

---

## 🚀 Próximos Passos

### Arquivos FALTANTES para completar o sistema:

#### **Layout Components (4 arquivos):**
1. ⏳ `Header.jsx` - Header principal com navegação
2. ⏳ `Sidebar.jsx` - Sidebar para desktop
3. ⏳ `MobileNav.jsx` - Bottom navigation para mobile
4. ⏳ `SubscriberLayout.jsx` - Layout wrapper

#### **Páginas (14 arquivos):**
1.  ⏳ `Feed.jsx` - Feed personalizado
2. ⏳ `Explore.jsx` - Explorar criadores
3. ⏳ `Trending.jsx` - Conteúdo em alta
4. ⏳ `Favorites.jsx` - Criadores favoritados
5. ⏳ `PostView.jsx` - Visualização completa de post
6. ⏳ `CreatorProfile.jsx` - Perfil público do criador
7. ⏳ `Profile.jsx` - Perfil do assinante
8. ⏳ `Settings.jsx` - Configurações (6 tabs)
9. ⏳ `Subscriptions.jsx` - Gerenciar assinaturas
10.  ⏳ `Messages.jsx` - Inbox de mensagens
11. ⏳ `Chat.jsx` - Chat individual
12. ⏳ `Wallet.jsx` - Carteira digital
13. ⏳ `Transactions.jsx` - Histórico de transações
14. ⏳ `Notifications.jsx` - Centro de notificações

#### **Documentação:**
15. ⏳ `pages/subscriber/README.md` - Documentação das páginas

---

## 📊 Progresso Atual

```
✅ CONCLUÍDO: 19/38 arquivos (50%)
⏳ PENDENTE:  19/38 arquivos (50%)
```

### Distribuição:

| Categoria | Concluído | Total | % |
|-----------|-----------|-------|---|
| Utils | 3 | 3 | 100% ✅ |
| Contexts | 2 | 2 | 100% ✅ |
| Hooks | 4 | 4 | 100% ✅ |
| Components | 10 | 10 | 100% ✅ |
| Layout | 0 | 4 | 0% ⏳ |
| Pages | 0 | 14 | 0% ⏳ |
| Docs | 0 | 1 | 0% ⏳ |

---

## 🎨 Padrões de Design

### Cores (Tailwind CSS):

```javascript
// Primary (Purple/Pink gradient)
bg-gradient-to-r from-purple-600 to-pink-600

// Status Colors
- Success: green-600 / green-100
- Warning: yellow-600 / yellow-100
- Error: red-600 / red-100
- Info: blue-600 / blue-100
- Pending: gray-600 / gray-100

// Dark Mode
dark:bg-gray-800
dark:text-white
dark:border-gray-700
```

### Componentes seguem padrão:

1. **Props com destructuring**
2. **Estados locais com useState**
3. **Efeitos com useEffect**
4. **Funções de handler com prefixo `handle`**
5. **Classes Tailwind responsivas**
6. **Dark mode support**
7. **Loading states**
8. **Error handling**

---

## 🐛 Debugging

### Console logs importantes:

```javascript
// SocketContext
✅ Socket conectado: [socket.id]
❌ Socket desconectado: [reason]
🔴 Erro de conexão socket: [error]

// NotificationContext
// Logs automáticos em erros de API
```

### Verificar se Socket está conectado:

```javascript
const { isConnected } = useSocket();
console.log('Socket conectado? ', isConnected);
```

### Verificar notificações:

```javascript
const { notifications, unreadCount } = useNotifications();
console.log('Notificações:', notifications);
console.log('Não lidas:', unreadCount);
```

---

## 🔒 Segurança

### Tokens de autenticação:

Todos os componentes esperam que o token JWT esteja armazenado em:
```javascript
localStorage.getItem('pride_connect_token')
```

### Headers padrão nas requisições:

```javascript
{
  headers: {
    Authorization: `Bearer ${token}`
  }
}
```

### Validação de idade (18+):

```javascript
import { isOver18 } from '../utils/validators';

if (!isOver18(birthdate)) {
  // Bloquear acesso
}
```

---

## 📱 Responsividade

### Breakpoints:

```javascript
// Mobile: < 768px
// Tablet: 768px - 1024px
// Desktop: > 1024px
```

### Classes Tailwind:

```jsx
// Mobile-first approach
<div className="flex flex-col md:flex-row lg:gap-8">
  {/* Mobile: column, Desktop: row */}
</div>

// Hidden on mobile
<div className="hidden md:block">Sidebar</div>

// Hidden on desktop
<div className="block md:hidden">Mobile Nav</div>
```

---

## ⚡ Performance

### Otimizações implementadas:

1. ✅ **Debounce** em buscas (500ms)
2. ✅ **Infinite scroll** em vez de paginação
3. ✅ **Lazy loading** de imagens (blur placeholder)
4. ✅ **Memoization** em callbacks (useCallback)
5. ✅ **IntersectionObserver** para infinite scroll
6. ✅ **Socket.io** para real-time (menos polling)

### Próximas otimizações (nas páginas):

- ⏳ Code splitting por rota (React.lazy)
- ⏳ Virtual scrolling em listas muito longas
- ⏳ Service Worker para cache
- ⏳ Image optimization (WebP, thumbnails)

---

## 📞 Suporte

### Dúvidas sobre componentes:

Cada componente tem comentários JSDoc explicando:
- Propósito
- Props aceitas
- Features principais
- Exemplo de uso

### Referências úteis:

- [React Router v6 Docs](https://reactrouter.com)
- [Socket.io Client Docs](https://socket.io/docs/v4/client-api/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [date-fns Docs](https://date-fns.org/docs)
- [React Icons](https://react-icons.github. io/react-icons/)

---

## ✅ Checklist de Verificação

Antes de prosseguir para Layout e Páginas, verifique:

- [ ] Todos os 19 arquivos foram criados
- [ ] `npm install` executado com sucesso
- [ ] Variáveis de ambiente configuradas (. env)
- [ ] Estrutura de pastas criada
- [ ] AuthContext já existe (ou criar)
- [ ] Backend está rodando (para testar APIs)
- [ ] Socket.io server está configurado

---

**🎉 Parabéns!   Você tem a base sólida do sistema de assinantes! **

**👉 Próximo passo:** Criar os 4 componentes de Layout para estruturar as páginas. 

Digite **"continuar"** quando estiver pronto!   🚀

---  
**Data:** 07/12/2025  
**Versão:** 1.0  
**Projeto:** PrideConnect - Adult Marketplace LGBT+