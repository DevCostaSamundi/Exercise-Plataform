#!/bin/bash

echo "🔧 Setting up PostgreSQL in Codespace..."

# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Wait for PostgreSQL to start
sleep 3

# Create database and user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE exercise_platform;

-- Create user with password
CREATE USER postgres WITH PASSWORD 'yourpassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE exercise_platform TO postgres;

-- Connect to the database and grant schema permissions
\c exercise_platform
GRANT ALL ON SCHEMA public TO postgres;
ALTER USER postgres CREATEDB;
EOF

echo "✅ PostgreSQL setup complete!"
echo "📝 Database: exercise_platform"
echo "👤 User: postgres"
echo "🔑 Password: yourpassword"
echo ""
echo "🔄 Run: npx prisma generate && npx prisma migrate dev"
