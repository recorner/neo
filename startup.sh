#!/bin/bash

echo "🚀 Starting application..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Run JWT secret generation script in the background
echo "🔐 Generating JWT secrets..."
node generateSecret.js &

# Initialize the database
echo "📊 Setting up database..."
npx prisma generate
npx prisma migrate deploy

echo "🌐 Starting web server..."

# Start your main application
exec "$@"
