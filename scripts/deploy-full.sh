#!/bin/bash
# =============================================================================
# ERC-8004 Agent Scanner - Deployment Script
# =============================================================================
# This script deploys the smart contracts and sets up the environment
# Usage: ./scripts/deploy-full.sh
# =============================================================================

set -e

echo "============================================="
echo "ERC-8004 Agent Scanner - Full Deployment"
echo "============================================="
echo ""

# Check prerequisites
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found"
    echo "Please copy .env.example to .env and configure it"
    exit 1
fi

# Load environment
source .env

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "ERROR: DEPLOYER_PRIVATE_KEY not set in .env"
    exit 1
fi

# Step 1: Build contracts
echo "[1/5] Building smart contracts..."
cd packages/contracts
npm run build
echo "      Contracts compiled successfully"

# Step 2: Deploy to Fuji
echo ""
echo "[2/5] Deploying to Avalanche Fuji testnet..."
npx hardhat run scripts/deploy.ts --network fuji
echo "      Contracts deployed successfully"
echo ""
echo "      IMPORTANT: Copy the contract addresses above to your .env file"
echo ""

# Step 3: Go back to root
cd ../..

# Step 4: Generate Prisma client
echo "[3/5] Generating Prisma client..."
cd packages/db
npx prisma generate
echo "      Prisma client generated"

# Step 5: Push database schema
echo ""
echo "[4/5] Pushing database schema..."
npx prisma db push
echo "      Database schema applied"

cd ../..

echo ""
echo "[5/5] Deployment complete"
echo ""
echo "============================================="
echo "Next steps:"
echo "1. Update .env with the deployed contract addresses"
echo "2. Start the API: cd apps/api && npm run dev"
echo "3. Start the worker: cd apps/worker && npm run dev"
echo "4. Start the web: cd apps/web && npm run dev"
echo "============================================="
