# Exercise Platform - Adult Marketplace

A full-stack LGBT+ adult content platform with messaging, live chat, and e-commerce features.

## Tech Stack

- **Backend**: Node.js, Express, Prisma, PostgreSQL, Socket.IO
- **Frontend**: React, Vite, TailwindCSS
- **Database**: PostgreSQL
- **Cache**: Redis
- **File Storage**: Cloudinary (with local fallback)

## Features

- User authentication with JWT
- Creator profiles and content management
- Direct messaging (DMs) with configurable policies
- Live chat with tips and highlights
- Real-time communication via Socket.IO
- E-commerce marketplace
- Docker-based development environment

## Getting Started with Docker (Recommended)

### Prerequisites

- Docker and Docker Compose installed
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/DevCostaSamundi/Exercise-Plataform.git
   cd Exercise-Plataform
   ```

2. **Create environment file**
   ```bash
   cp .env.docker.example .env
   # Edit .env with your configuration if needed
   ```

3. **Build and start all services**
   ```bash
   docker compose up --build
   ```

4. **Run database migrations** (in another terminal)
   ```bash
   docker compose exec backend npx prisma migrate dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/v1
   - API Health: http://localhost:5000/health

### Useful Docker Commands

```bash
# Start services
docker compose up

# Start in detached mode
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Rebuild services
docker compose up --build

# Run Prisma commands
docker compose exec backend npx prisma migrate dev
docker compose exec backend npx prisma studio
docker compose exec backend npx prisma generate

# Access backend shell
docker compose exec backend sh

# Access PostgreSQL
docker compose exec postgres psql -U exercise_user -d exercise_platform
```

## Manual Setup (Without Docker)

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run Prisma migrations**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd adult-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## API Documentation

### Health Check
```
GET /health
```

### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/creator-register
```

### Creators
```
GET  /api/v1/creators
GET  /api/v1/creators/:id
GET  /api/v1/creators/:id/chat-config
POST /api/v1/creators
PUT  /api/v1/creators/:id
```

### Chat & Messaging
```
POST /api/v1/chats                    # Create or get DM chat
GET  /api/v1/chats/:id/messages       # Get chat messages
POST /api/v1/messages                 # Send message (fallback)
```

### Socket.IO Events

**Client → Server:**
- `join:live` - Join a live chat room
- `leave:live` - Leave a live chat room
- `chat:message` - Send a DM
- `live:message` - Send a message in live chat
- `tip:send` - Send a tip with highlight
- `moderation:delete` - Delete a message (moderators)

**Server → Client:**
- `chat:message` - Receive DM
- `live:message` - Receive live chat message
- `moderation:deleted` - Message deleted notification
- `notification:new` - New notification (e.g., tip received)

## Project Structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── utils/
│   │   └── app.js
│   ├── server.js
│   └── package.json
├── adult-marketplace/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Testing

### Backend Tests
```bash
# With Docker
docker compose exec backend npm test

# Without Docker
cd backend && npm test
```

### Test Messaging Flows

1. **Register two users**: One as regular user, one as creator
2. **Open DM**: User clicks "Enviar mensagem" on creator profile
3. **Send messages**: Test real-time messaging
4. **Join Live**: Creator starts live, user joins
5. **Send tips**: Click "Tip R$10" button in live chat
6. **Verify highlight**: Tip message should be highlighted

## Environment Variables

See `.env.docker.example` for Docker setup or `backend/.env.example` for manual setup.

### Required Variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

### Optional Variables:
- `CLOUDINARY_*` - For cloud file storage (falls back to local)
- `EMAIL_*` - For email notifications (dev-safe, no-op in development)
- `REDIS_URL` - For caching and sessions

## Notes

- **Payment Integration**: Tip/payment gateway is currently stubbed. Tips are recorded but no real payment processing occurs.
- **File Uploads**: System uses Cloudinary when configured, otherwise saves files locally in `backend/uploads/`
- **Email Service**: In development mode, emails are logged but not sent
- **Security**: Change all default secrets in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC
