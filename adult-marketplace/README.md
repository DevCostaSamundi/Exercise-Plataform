# 🏳️‍🌈 PrideConnect - Frontend

Plataforma de conteúdo exclusivo focada na comunidade LGBT+.

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+ instalado
- Backend rodando em `http://localhost:5000`

### Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## 📂 Estrutura

```
src/
├── components/        # Componentes reutilizáveis
├── contexts/         # React Context (Auth, Chat, etc)
├── pages/            # Páginas da aplicação
│   ├── Creator/     # Páginas do painel do criador
│   └── Static/      # Páginas estáticas (termos, privacidade)
├── services/        # API e Socket.IO
└── App.jsx          # Rotas principais
```

## 🔐 Verificação de Idade

A aplicação exige que o usuário confirme ter **18+ anos** antes de acessar qualquer conteúdo.

## 🛠️ Tecnologias

- **React 19** + **Vite**
- **React Router DOM** (rotas)
- **Tailwind CSS** (estilização)
- **Axios** (requisições HTTP)
- **Socket.IO Client** (tempo real)

## 📝 Licença

Propriedade de DevCostaSamundi
