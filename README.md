# Avalanche ERC-8004 Agent Scanner

> A production-ready scanner for the agentic economy on Avalanche, implementing ERC-8004 with Sentinel trust layer.

![Avalanche](https://img.shields.io/badge/Avalanche-E84142?style=flat&logo=avalanche&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)

## Features

- **ERC-8004 Compliant**: Full implementation of Identity, Reputation, and Validation registries
- **Real-time Indexing**: Polls blockchain for events and hydrates agent metadata
- **Trust Badges**: TLS, DNS, and endpoint verification via Sentinel
- **x402 Support**: Tracks agents with payment protocol support
- **Modern UI**: Dark theme with Avalanche branding, responsive design

## Architecture

```
├── packages/
│   ├── db/                # Prisma + PostgreSQL schema
│   ├── erc8004-sdk/       # ABIs, schemas, URI resolver
│   └── contracts/         # Solidity contracts + Hardhat
├── apps/
│   ├── worker/            # Event indexer + metadata hydrator
│   ├── api/               # Express REST API
│   └── web/               # Next.js frontend
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### 1. Setup

```bash
# Clone and install
cd shadow-galaxy
cp .env.example .env
pnpm install

# Start PostgreSQL
docker-compose up -d

# Generate Prisma client & migrate
pnpm db:generate
pnpm db:migrate
```

### 2. Deploy Contracts (Fuji Testnet)

```bash
# Add your private key to .env
# DEPLOYER_PRIVATE_KEY=0x...

cd packages/contracts
pnpm build
pnpm deploy:fuji
```

Update `.env` with the deployed contract addresses.

### 3. Run Services

```bash
# Terminal 1: Start worker
cd apps/worker && pnpm dev

# Terminal 2: Start API
cd apps/api && pnpm dev

# Terminal 3: Start frontend
cd apps/web && pnpm dev
```

Open http://localhost:3000

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/agents` | List agents (with filters) |
| `GET /api/v1/agents/:id` | Get agent details |
| `GET /api/v1/agents/:id/feedback` | Get agent feedback |
| `GET /api/v1/agents/:id/validations` | Get agent validations |
| `GET /api/v1/stats` | Global statistics |
| `GET /health` | Health check |

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://scanner:scanner_secret@localhost:5432/agent_scanner

# Blockchain
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CHAIN_ID=43113

# Contracts (set after deployment)
IDENTITY_REGISTRY_ADDRESS=0x...
REPUTATION_REGISTRY_ADDRESS=0x...
VALIDATION_REGISTRY_ADDRESS=0x...

# Indexer
POLL_INTERVAL_MS=5000
BATCH_SIZE=1000

# API
API_PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Database**: PostgreSQL + Prisma ORM
- **Blockchain**: viem + Hardhat
- **Backend**: Express + TypeScript
- **Frontend**: Next.js 15 + React 19
- **Validation**: Zod schemas

## Scripts

```bash
pnpm build          # Build all packages
pnpm dev            # Start all dev servers
pnpm typecheck      # Run type checking
pnpm lint           # Run linting
pnpm docker:up      # Start PostgreSQL
pnpm docker:down    # Stop PostgreSQL
```

## License

MIT
