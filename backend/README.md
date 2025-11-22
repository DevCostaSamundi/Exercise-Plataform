# PrideConnect Backend API

Backend API for PrideConnect - LGBT+ Adult Content Platform built with Node.js, Express, and PostgreSQL.

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **File Upload**: Multer + Cloudinary
- **Email**: NodeMailer
- **Security**: Helmet, CORS, Express Rate Limit
- **Logging**: Winston

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files (database, jwt, cloudinary, email)
│   ├── controllers/      # Business logic for endpoints
│   ├── middleware/       # Custom middlewares (auth, validation, upload, error)
│   ├── models/          # Prisma models/schemas
│   ├── routes/          # API route definitions
│   ├── services/        # External services (email, upload, jwt)
│   ├── utils/           # Utility functions (logger, response, errors)
│   ├── validators/      # Validation schemas
│   └── app.js           # Express app configuration
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Seed data
├── uploads/             # Temporary uploads folder
├── .env.example         # Environment variables example
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
├── README.md           # This file
└── server.js           # Main entry point
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and configure your environment variables:
   - Database connection string
   - JWT secrets
   - Cloudinary credentials
   - Email configuration
   - etc.

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   
   # (Optional) Seed the database
   npm run prisma:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000` (or the port specified in your `.env` file)

## 📜 Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed the database with initial data
- `npm run prisma:reset` - Reset database (⚠️ deletes all data)

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `CLOUDINARY_*` - Cloudinary credentials for file uploads
- `EMAIL_*` - Email service configuration
- `FRONTEND_URL` - Frontend URL for CORS

## 🗄️ Database Schema

The database schema is defined in `prisma/schema.prisma`. Main entities include:
- Users
- Creators
- Posts
- Subscriptions
- Products (Marketplace)
- Transactions
- etc.

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/password` - Change password

### Creators
- `GET /api/v1/creators` - List all creators
- `GET /api/v1/creators/:id` - Get creator by ID
- `POST /api/v1/creators` - Become a creator
- `PUT /api/v1/creators/:id` - Update creator profile

### Posts
- `GET /api/v1/posts` - List all posts
- `GET /api/v1/posts/:id` - Get post by ID
- `POST /api/v1/posts` - Create new post
- `PUT /api/v1/posts/:id` - Update post
- `DELETE /api/v1/posts/:id` - Delete post

## 🔒 Security Features

- **Helmet** - Secure HTTP headers
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Prevent brute force attacks
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcryptjs for password encryption
- **Input Validation** - Joi schema validation
- **File Upload Restrictions** - File type and size limits

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production` in your `.env`
2. Configure a production PostgreSQL database
3. Set strong JWT secrets
4. Configure proper CORS origins
5. Set up SSL/HTTPS
6. Use a process manager like PM2
7. Set up proper logging and monitoring

## 📝 License

ISC

## 👥 Contributing

Please follow the existing code structure and conventions when contributing.
