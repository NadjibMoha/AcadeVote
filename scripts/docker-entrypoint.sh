#!/bin/sh

echo "Waiting for Hardhat node (hardhat:8545)..."
while ! nc -z hardhat 8545; do   
  sleep 1
done
echo "Hardhat node is up."

echo "Waiting for PostgreSQL (postgres:5432)..."
while ! nc -z postgres 5432; do   
  sleep 1
done
echo "PostgreSQL is up."

echo "Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

echo "Running migrations..."
cd server
npm run migrate

echo "Seeding database..."
cd ..
npx hardhat run scripts/seed.js --network localhost

echo "Starting Express server..."
cd server
npm start
