# ERC-8004 Agent Scanner

A production-ready scanner for the AI agent economy on Avalanche, implementing the ERC-8004 standard with Identity, Reputation, and Validation registries.

## Overview

This scanner indexes and displays ERC-8004 compliant AI agents registered on Avalanche. It provides:

- Real-time blockchain event indexing
- Agent metadata resolution (IPFS, Arweave, data URIs)
- Reputation and feedback tracking
- Validation status monitoring
- REST API for integrations
- Web interface for discovery

## Architecture

```
scan-erc-8004/
├── packages/
│   ├── db/                 # Prisma ORM and database schema
│   ├── erc8004-sdk/        # Contract ABIs, schemas, utilities
│   └── contracts/          # Solidity smart contracts
├── apps/
│   ├── worker/             # Event indexer service
│   ├── api/                # REST API server
│   └── web/                # Next.js frontend
├── docker-compose.yml      # PostgreSQL setup
└── package.json            # Workspace configuration
```

## Prerequisites

- Node.js 20 or higher
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)
- Avalanche Fuji testnet AVAX for deployment

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Cyberpaisa/scan-erc-8004.git
cd scan-erc-8004
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database (default works with Docker)
DATABASE_URL="postgresql://scanner:scanner_secret@localhost:5432/agent_scanner"

# Blockchain
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CHAIN_ID=43113

# Contract addresses (set after deployment)
IDENTITY_REGISTRY_ADDRESS=0x2f7134e0e0eb7062D99De95d13593735B8634647
REPUTATION_REGISTRY_ADDRESS=0xaA4Dff1aB0a62d528D59252d8739ADC828eB396d
VALIDATION_REGISTRY_ADDRESS=0x4153216221d4Dd4C3E423c6bc349965584bB4C87

# For deployment only
DEPLOYER_PRIVATE_KEY=0x...
```

### 3. Start Database

```bash
npm run docker:up
```

### 4. Initialize Database Schema

```bash
cd packages/db
npx prisma generate
npx prisma db push
cd ../..
```

### 5. Deploy Contracts (Optional)

If deploying your own contracts to Fuji testnet:

```bash
cd packages/contracts
npm run build
npx hardhat run scripts/deploy.ts --network fuji
```

Update `.env` with the deployed contract addresses.

### 6. Run Services

Start each service in a separate terminal:

```bash
# Terminal 1: API Server
cd apps/api
npm run dev

# Terminal 2: Indexer Worker
cd apps/worker
npm run dev

# Terminal 3: Web Frontend
cd apps/web
npm run dev
```

Access the application at http://localhost:3000

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/agents` | List agents with pagination and filters |
| GET | `/api/v1/agents/:id` | Get agent details |
| GET | `/api/v1/agents/:id/feedback` | Get agent feedback history |
| GET | `/api/v1/agents/:id/validations` | Get agent validations |
| GET | `/api/v1/stats` | Global statistics |
| GET | `/api/v1/stats/activity` | Recent activity feed |

### Query Parameters

For `/api/v1/agents`:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search by name or description
- `active` - Filter by active status (true/false)
- `x402` - Filter by x402 support (true/false)
- `sortBy` - Sort field (default: registeredAt)
- `sortOrder` - Sort order (asc/desc)

## Smart Contracts

### Identity Registry

ERC-721 based registry for agent identities.

- `register(agentURI)` - Register new agent
- `setAgentURI(agentId, newURI)` - Update agent metadata
- `setMetadata(agentId, key, value)` - Set on-chain metadata
- `setAgentWallet(agentId, wallet, signature)` - Link wallet address

### Reputation Registry

On-chain feedback and reputation tracking.

- `giveFeedback(agentId, score, ...)` - Submit feedback (0-100)
- `revokeFeedback(agentId, feedbackIndex)` - Revoke feedback
- `appendResponse(agentId, clientAddress, feedbackIndex, ...)` - Respond to feedback

### Validation Registry

Third-party validation for high-stakes tasks.

- `validationRequest(validator, agentId, ...)` - Request validation
- `validationResponse(requestHash, response, ...)` - Submit validation result

## Database Schema

Key models:

- `Agent` - Core agent data and metadata
- `Endpoint` - Agent service endpoints
- `Feedback` - Reputation feedback records
- `Validation` - Validation requests and responses
- `IndexerCursor` - Block tracking for each registry

## Configuration Reference

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | Required |
| RPC_URL | Avalanche RPC endpoint | Required |
| CHAIN_ID | Network chain ID | 43113 (Fuji) |
| START_BLOCK | Starting block for indexer | 0 |
| POLL_INTERVAL_MS | Indexer poll interval | 5000 |
| BATCH_SIZE | Max blocks per poll | 1000 |
| API_PORT | API server port | 3001 |
| IPFS_GATEWAY | IPFS gateway URL | https://ipfs.io/ipfs/ |
| ARWEAVE_GATEWAY | Arweave gateway URL | https://arweave.net/ |

## Development

### Build All Packages

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Database Migrations

```bash
cd packages/db
npx prisma migrate dev --name <migration_name>
```

### Adding New Contracts

1. Update Solidity files in `packages/contracts/contracts/`
2. Update ABIs in `packages/erc8004-sdk/src/abis/`
3. Update event handlers in `apps/worker/src/handlers/`

## Deployment

### Production Considerations

- Use managed PostgreSQL (AWS RDS, Supabase, etc.)
- Configure proper RPC endpoint (Infura, Alchemy, or dedicated node)
- Set up monitoring and logging
- Use process manager (PM2) or container orchestration
- Configure CORS and rate limiting for API

### Docker Production Build

```bash
# Build images
docker build -t scan-api -f apps/api/Dockerfile .
docker build -t scan-worker -f apps/worker/Dockerfile .
docker build -t scan-web -f apps/web/Dockerfile .
```

## Standards Compliance

This implementation follows:

- ERC-8004: Trustless Agents specification
- ERC-721: Non-Fungible Token Standard (for Identity Registry)
- Agent Metadata Profile (services, endpoints, x402 support)

## Related Resources

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [8004.org](https://8004.org) - Official ERC-8004 community
- [Avalanche Documentation](https://docs.avax.network/)

## License

MIT

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

## Repository

https://github.com/Cyberpaisa/scan-erc-8004
