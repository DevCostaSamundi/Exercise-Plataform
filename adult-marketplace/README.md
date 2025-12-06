# 🏳️‍🌈 PrideConnect - Frontend

Plataforma de conteúdo exclusivo focada na comunidade LGBT+.

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+ instalado
- Backend rodando (padrão: `http://localhost:5000`)

### Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env

# Editar .env com suas configurações
# nano .env

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

### Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou copie de `.env.example`):

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_VERSION=v1

# Application
VITE_APP_NAME=PrideConnect
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development

# Features
VITE_ENABLE_LOGGING=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_MESSAGING=true
VITE_ENABLE_ANALYTICS=true
```

**Importante:** 
- `VITE_API_URL` deve apontar para o backend SEM o `/api/v1` (isso é adicionado automaticamente)
- Todas as variáveis devem começar com `VITE_` para serem acessíveis no frontend
- Para produção, defina `VITE_ENABLE_LOGGING=false`

## 📂 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── AgeGate.jsx      # Verificação de idade
│   ├── ErrorBoundary.jsx # Captura de erros React
│   ├── ErrorMessage.jsx  # Mensagens de erro
│   ├── LoadingSpinner.jsx # Indicador de carregamento
│   ├── Sidebar.jsx       # Navegação principal
│   ├── CreatorSidebar.jsx # Navegação do criador
│   └── ...
├── contexts/            # React Context
│   └── AuthContext.jsx  # Contexto de autenticação
├── pages/               # Páginas da aplicação
│   ├── Creator/        # Painel do criador
│   │   ├── CreatorDashboardPage.jsx
│   │   ├── CreatorAnalyticsPage.jsx
│   │   ├── CreatorPostsPage.jsx
│   │   ├── CreatorEarningsPage.jsx
│   │   ├── CreatorMessagesPage.jsx
│   │   ├── CreatorSubscribersPage.jsx
│   │   ├── CreatorNotificationsPage.jsx
│   │   ├── CreatorSettingsPage.jsx
│   │   └── ...
│   ├── Static/         # Páginas estáticas
│   │   ├── TermsPage.jsx
│   │   ├── PrivacyPage.jsx
│   │   └── SupportPage.jsx
│   ├── TrendingPage.jsx    # Criadores em alta
│   ├── ExplorePage.jsx     # Explorar criadores
│   ├── FavoritesPage.jsx   # Favoritos do usuário
│   ├── MySubscriptionsPage.jsx # Assinaturas ativas
│   ├── HelpPage.jsx        # Central de ajuda
│   ├── SafetyPage.jsx      # Diretrizes de segurança
│   └── ...
├── services/           # Serviços e APIs
│   ├── api.js         # Cliente Axios centralizado
│   ├── authAPI.js     # Autenticação
│   ├── creatorsAPI.js # Criadores
│   └── ...
├── hooks/             # Custom React Hooks
├── assets/            # Imagens, ícones, etc
├── App.jsx            # Componente principal com rotas
├── main.jsx           # Entry point
└── index.css          # Estilos globais
```

## 🗺️ Estrutura de Rotas

### Rotas Públicas
- `/` - Página inicial
- `/login` - Login
- `/register` - Registro
- `/forgot-password` - Recuperação de senha
- `/creator/:id` - Perfil público do criador
- `/trending` - Criadores em alta
- `/explore` - Explorar criadores
- `/terms` - Termos de uso
- `/privacy` - Política de privacidade
- `/support` - Suporte
- `/help` - Central de ajuda
- `/safety` - Diretrizes de segurança

### Rotas do Criador (Protegidas)
- `/creator/dashboard` - Dashboard principal
- `/creator/analytics` - Analytics e estatísticas
- `/creator/posts` - Gerenciar posts
- `/creator/upload` - Fazer upload de conteúdo
- `/creator/earnings` - Ganhos e saques
- `/creator/messages` - Mensagens
- `/creator/subscribers` - Assinantes
- `/creator/notifications` - Notificações
- `/creator/profile` - Perfil do criador
- `/creator/settings` - Configurações

### Rotas do Assinante (Protegidas)
- `/favorites` - Criadores favoritos
- `/my-subscriptions` - Assinaturas ativas
- `/messages` - Mensagens
- `/notifications` - Notificações
- `/settings` - Configurações
- `/profile` - Perfil do usuário

**Nota:** Rotas antigas (`/creator-dashboard`, `/creator-posts`, etc.) redirecionam automaticamente para as novas rotas (`/creator/dashboard`, `/creator/posts`, etc.)

## 🔐 Verificação de Idade

A aplicação exige que o usuário confirme ter **18+ anos** antes de acessar qualquer conteúdo. A verificação é armazenada no localStorage.

## 🛠️ Tecnologias

- **React 19** - Framework JavaScript
- **Vite** - Build tool e dev server
- **React Router DOM 7** - Roteamento
- **Tailwind CSS 3** - Framework CSS
- **Axios** - Cliente HTTP
- **Socket.IO Client** - Comunicação em tempo real
- **PropTypes** - Type checking

## 🔧 Integração com API

### Cliente API Centralizado

Todas as requisições HTTP usam o cliente Axios configurado em `src/services/api.js`:

```javascript
import api from '../services/api';

// GET request
const response = await api.get('/endpoint');

// POST request
const response = await api.post('/endpoint', { data });

// PUT request
const response = await api.put('/endpoint/:id', { data });

// DELETE request
const response = await api.delete('/endpoint/:id');
```

### Funcionalidades do Cliente API

- ✅ Base URL configurável via `.env`
- ✅ Timeout de 15 segundos
- ✅ Autenticação automática (Bearer token)
- ✅ Interceptors de request e response
- ✅ Tratamento global de erros (401, 403, 404, 500)
- ✅ Redirect automático para login em 401
- ✅ Logging em modo desenvolvimento
- ✅ Credenciais incluídas (cookies)

### Tratamento de Erros Padrão

```javascript
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/endpoint');
      setData(response.data?.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" message="Carregando..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return <div>{/* Render data */}</div>;
}
```

## 🐛 Troubleshooting

### Erro: "Cannot connect to backend"

**Problema:** Frontend não consegue se conectar ao backend.

**Soluções:**
1. Verifique se o backend está rodando (`http://localhost:5000`)
2. Verifique a variável `VITE_API_URL` no arquivo `.env`
3. Verifique se há problemas de CORS no backend
4. Limpe o cache do navegador e reinicie o dev server

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json dist
npm install
npm run dev
```

### Erro: "401 Unauthorized"

**Problema:** Token de autenticação inválido ou expirado.

**Soluções:**
1. Faça logout e login novamente
2. Limpe o localStorage: `localStorage.clear()` no console do navegador
3. Verifique se o token está sendo enviado corretamente nos headers

### Erro: "Page not found" ou "404"

**Problema:** Rota não existe ou foi removida.

**Soluções:**
1. Verifique se a rota está definida em `src/App.jsx`
2. Verifique se há typos no caminho
3. Use as novas rotas `/creator/*` ao invés de `/creator-*`

### Build falha com erro de TypeScript/ESLint

**Problema:** Erros de linting ou type checking.

**Soluções:**
1. Execute `npm run lint` para ver os erros
2. Corrija os erros ou ajuste as regras em `eslint.config.js`
3. Para builds de emergência: remova a etapa de lint do build (não recomendado)

### Problema de performance em desenvolvimento

**Problema:** App lento no modo de desenvolvimento.

**Soluções:**
1. Desative logging: `VITE_ENABLE_LOGGING=false` no `.env`
2. Use React DevTools para identificar re-renders desnecessários
3. Considere usar React.memo() e useMemo() em componentes pesados

## 📱 Responsividade

Todas as páginas são responsivas e seguem o padrão **mobile-first**:

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

Classes Tailwind usadas:
- `sm:` - Small devices (≥640px)
- `md:` - Medium devices (≥768px)
- `lg:` - Large devices (≥1024px)
- `xl:` - Extra large devices (≥1280px)

## ♿ Acessibilidade

O projeto segue as diretrizes WCAG 2.1 Nível AA:

- Todos os botões e links têm labels descritivos
- Imagens têm texto alternativo apropriado
- Navegação por teclado funcional
- Contraste de cores adequado
- Focus indicators visíveis
- ARIA labels onde necessário

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento (port 5173)

# Build
npm run build        # Build para produção

# Preview
npm run preview      # Preview da build de produção

# Linting
npm run lint         # Executa ESLint

# Testes (quando implementado)
npm test             # Executa testes
```

## 🤝 Contribuindo

1. Clone o repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Propriedade de DevCostaSamundi

## 🆘 Suporte

- **Documentação:** Visite `/help` na aplicação
- **Problemas técnicos:** Abra uma issue no GitHub
- **Segurança:** Leia `/safety` para diretrizes de segurança
