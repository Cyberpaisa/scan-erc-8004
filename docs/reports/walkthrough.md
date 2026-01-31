# Avalanche ERC-8004 Agent Scanner - Walkthrough

## What Was Built

A complete MVP for an **ERC-8004 Agent Scanner** on Avalanche, with these components:

### Packages
| Package | Description |
|---------|-------------|
| `packages/db` | Prisma schema with Agent, Endpoint, Feedback, Validation models |
| `packages/erc8004-sdk` | ABIs, Zod schemas, URI resolver, hash calculator |
| `packages/contracts` | Solidity contracts (Identity, Reputation, Validation registries) |

### Applications
| App | Description |
|-----|-------------|
| `apps/worker` | Event indexer with metadata hydration |
| `apps/api` | Express REST API with agent CRUD endpoints |
| `apps/web` | Next.js frontend with dark Avalanche theme |

---

## Key Files

```
shadow-galaxy/
├── package.json              # npm workspaces config
├── docker-compose.yml        # PostgreSQL setup
├── .env.example              # Environment template
├── packages/
│   ├── db/prisma/schema.prisma       # Database schema
│   ├── erc8004-sdk/src/              # SDK with ABIs, schemas, utilities
│   └── contracts/contracts/          # Solidity contracts
└── apps/
    ├── worker/src/main.ts            # Indexer entry point
    ├── api/src/routes/agents.ts      # Agent API routes
    └── web/app/page.tsx              # Home page with agent grid
```

---

## Deployment & Hardening Status

The project is currently deployed on **Avalanche Fuji** with a hardened architecture to ensure production-grade reliability.

### Deployed Contracts (Fuji)
- **Identity Registry**: `0x2F715697669d03197170068305c6Cc5992924647`
- **Reputation Registry**: `0xc4939b4D5f9E2c84B8E17904baF0a33118A45133`
- **Validation Registry**: `0xA8A99cEF3C3322d71687B75c7b399120689b14B6`

### Architectural Hardening
To address the audit findings, the following improvements have been implemented:
1. **Indexer Persistence**: Uses `IndexerCursor` in the database to track the last processed block, preventing data loss on restarts.
2. **Asynchronous Hydration**: Decoupled IPFS/Arweave metadata resolution into background tasks with **Exponential Backoff** retry logic.
3. **RPC Resilience**: Hardened RPC client with automatic retries and error handling to survive network instability.
4. **Sentinel Periodic Scans**: Automatically re-verifies all agent endpoints every 24 hours to ensure continuous trust alignment.
5. **Audit Dashboard**: A new premium UI available at `/tasks` to monitor background indexing health and metadata resolution resolution status.

### Registered Test Agents
The following agents are active and indexed:
1. **Weather Oracle Agent** (#1) - Real-time environmental data.
2. **DeFi Research Agent** (#2) - Protocol analysis and yield tracking.
3. **Code Review Agent** (#3) - Automated smart contract audits.
4. **Translation Agent** (#4) - Multi-language support for dApps.
5. **Supply Chain Agent** (#5) - Logistics and provenance tracking.

## Next Steps to Run
1. **Install**: `npm install`
2. **Build Core**: `npm run db:generate && npm run build --workspaces`
3. **Start Database**: `docker-compose up -d`
4. **Start API**: `cd apps/api && npm run dev`
5. **Start Web**: `cd apps/web && npm run dev`
6. **Start Worker**: `cd apps/worker && npm run dev`

---
> [!TIP]
> **Audit Dashboard**: Access the background task monitor at [http://localhost:3000/tasks](http://localhost:3000/tasks) to watch the system hydrate agents in real-time.

---

## Next Steps

1. **Verify on GitHub**: [Cyberpaisa/scan-erc-8004](https://github.com/Cyberpaisa/scan-erc-8004)
2. **Start Local Services**:
   ```bash
   npm run docker:up
   # Terminal 1: cd apps/api && npm run dev
   # Terminal 2: cd apps/worker && npm run dev
   # Terminal 3: cd apps/web && npm run dev
   ```
3. **Observe Indexer**: The worker will automatically find the 5 registered agents and hydrate their metadata into the local database.


---

## Remaining Work

- [ ] Sentinel endpoint scanning integration
- [ ] Trust badge calculation from scan results
- [ ] Production deployment configuration
