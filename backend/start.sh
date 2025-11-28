#!/bin/sh

echo "Waiting for database to be ready..."
sleep 5

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy || echo "Migration failed or already applied"

echo "Prisma client generated successfully!"
echo "Starting server..."
node dist/server.js
