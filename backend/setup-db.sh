#!/bin/bash
echo "Setting up PostgreSQL database..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "PostgreSQL is not running. Starting it..."
    sudo service postgresql start
fi

# Create user and database
sudo -u postgres psql << SQL
-- Drop existing user/db if they exist (optional)
DROP DATABASE IF EXISTS exercise_platform;
DROP USER IF EXISTS exercise_user;

-- Create new user and database
CREATE USER exercise_user WITH PASSWORD 'Adult149databaseMande';
CREATE DATABASE exercise_platform OWNER exercise_user;
GRANT ALL PRIVILEGES ON DATABASE exercise_platform TO exercise_user;
ALTER USER exercise_user CREATEDB;

-- Grant schema permissions
\c exercise_platform
GRANT ALL ON SCHEMA public TO exercise_user;
SQL

echo "✅ Database setup complete!"
echo "Running Prisma migrations..."

npx prisma generate
npx prisma migrate dev --name init

echo "✅ All done! You can now run: npm run dev"
