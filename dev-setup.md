# Development Setup Guide

This guide will help you set up the Exercise Platform project for local development.

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- Git

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Exercise-Plataform
```

### 2. Start PostgreSQL Database

Use Docker Compose to start a PostgreSQL 15 container for local development:

```bash
docker-compose up -d
```

This will start a PostgreSQL container with:
- **Container name**: `exercise-postgres`
- **Database**: `exercise_platform`
- **User**: `exercise_user`
- **Port**: `5432` (mapped to localhost)
- **Persistent storage**: Named volume `pgdata`

To check if the database is healthy:

```bash
docker-compose ps
```

To view database logs:

```bash
docker logs exercise-postgres
```

To stop the database:

```bash
docker-compose down
```

To stop and remove volumes (⚠️ this will delete all data):

```bash
docker-compose down -v
```

### 3. Configure Environment Variables

Navigate to the backend directory and create your `.env` file:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file and update the following variables:

- **DATABASE_URL**: Replace `YOUR_PASSWORD_HERE` with your chosen password (must match the password in `docker-compose.yml`)
- **JWT_SECRET**: Generate a secure random string (e.g., using `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`)
- **JWT_REFRESH_SECRET**: Generate another secure random string
- **CLOUDINARY_***: Add your Cloudinary credentials if you need file upload functionality
- **EMAIL_***: Configure your email service if you need email functionality

**Example DATABASE_URL**:
```
DATABASE_URL="postgresql://exercise_user:mypassword123@localhost:5432/exercise_platform?schema=public"
```

### 4. Verify Database Connection

Test that your DATABASE_URL is correctly configured:

```bash
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

This should output your database connection string (without exposing the password in logs).

### 5. Install Dependencies

```bash
npm install
```

### 6. Set Up Prisma

Generate the Prisma client:

```bash
npx prisma generate
```

Run database migrations to create the schema:

```bash
npx prisma migrate dev --name init
```

(Optional) Seed the database with initial data:

```bash
npm run prisma:seed
```

### 7. Start the Development Server

```bash
npm run dev
```

Or start without nodemon:

```bash
node server.js
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

### 8. Verify the API

Open your browser or use curl to test the API:

```bash
curl http://localhost:5000/api/v1
```

You should see a JSON response with API information and available endpoints.

## Useful Commands

### Database Management

- **Open Prisma Studio** (GUI for database): `npm run prisma:studio`
- **Create a new migration**: `npm run prisma:migrate`
- **Reset database** (⚠️ deletes all data): `npm run prisma:reset`
- **View database logs**: `docker logs -f exercise-postgres`

### Development

- **Run with auto-reload**: `npm run dev`
- **Run in production mode**: `npm start`

### Docker

- **Start database**: `docker-compose up -d`
- **Stop database**: `docker-compose down`
- **View running containers**: `docker-compose ps`
- **View logs**: `docker-compose logs -f postgres`
- **Restart database**: `docker-compose restart`

## Troubleshooting

### Database Connection Issues

If you can't connect to the database:

1. Check if the container is running: `docker-compose ps`
2. Check container logs: `docker logs exercise-postgres`
3. Verify your DATABASE_URL matches the credentials in `docker-compose.yml`
4. Ensure port 5432 is not already in use by another PostgreSQL instance

### Port Already in Use

If port 5432 is already in use, you can either:
- Stop the existing PostgreSQL service
- Modify `docker-compose.yml` to use a different port (e.g., `"5433:5432"`) and update your DATABASE_URL accordingly

### Prisma Migration Issues

If migrations fail:
1. Ensure the database is running and accessible
2. Check your DATABASE_URL is correct
3. Try resetting: `npm run prisma:reset` (⚠️ this deletes all data)

## Security Notes

- **Never commit** your `.env` file to version control
- The `.env.example` file contains placeholder values only
- Generate strong, unique secrets for JWT tokens
- Use different passwords for development and production
- Keep your `.env` file secure and don't share it

## Next Steps

- Read the main [README.md](backend/README.md) for API documentation
- Explore the API endpoints at `http://localhost:5000/api/v1`
- Check the Prisma schema at `backend/prisma/schema.prisma`
- Review the project structure in `backend/src/`

## Support

For issues or questions, please create an issue in the repository.
