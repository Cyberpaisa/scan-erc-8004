# Avalanche ERC-8004 Agent Scanner - MVP

> Scanner para economía agéntica en Avalanche con trust layer (Sentinel)

## Phase 1: Project Setup & Infrastructure
- [x] Create monorepo structure with workspaces
- [x] Setup Docker Compose for PostgreSQL
- [x] Configure TypeScript

## Phase 2: Database Package (`packages/db`)
- [x] Prisma schema for agents, endpoints, feedback, validations, scans
- [ ] Database migrations (run after setup)
- [ ] Seed data for testing

## Phase 3: ERC-8004 SDK (`packages/erc8004-sdk`)
- [x] Contract ABIs (Identity, Reputation, Validation registries)
- [x] Event types and decoders
- [x] Zod schema for AgentURI (services + endpoints compatibility)
- [x] URI resolver (ipfs://, ar://, data:application/json;base64)
- [x] Agent hash calculator (keccak256 of canonical JSON)

## Phase 4: Smart Contracts (`packages/contracts`)
- [x] Identity Registry contract (ERC-721 + URIStorage)
- [x] Reputation Registry contract
- [x] Validation Registry contract
- [x] Hardhat configuration for Fuji deployment
- [x] Deploy scripts

## Phase 5: Indexer Worker (`apps/worker`)
- [x] Event log polling from JSON-RPC
- [x] Block cursor persistence
- [x] Identity event handlers (Registered, URIUpdated, MetadataSet)
- [x] Reputation event handlers (NewFeedback, FeedbackRevoked)
- [x] Validation event handlers (ValidationRequest, ValidationResponse)
- [x] Metadata hydration (fetch + parse + hash)
- [ ] Sentinel endpoint scanning integration (future enhancement)
- [ ] Trust badge calculation (future enhancement)

## Phase 6: Backend API (`apps/api`)
- [x] Express server with TypeScript
- [x] `GET /api/v1/agents` - list with filters
- [x] `GET /api/v1/agents/:id` - agent details
- [x] `GET /api/v1/agents/:id/feedback` - feedback history
- [x] `GET /api/v1/agents/:id/validations` - validation history
- [x] Health and metrics endpoints

## Phase 7: Frontend UI (`apps/web`)
- [x] Next.js project setup
- [x] Agent list with sorting/filtering
- [x] Trust badges (TLS, DNS, x402, active status)
- [x] Agent detail page
- [x] Responsive design with modern aesthetics

## Phase 8: Verification & Polish
- [x] Run full build verification
- [x] Verify API endpoints with mock/real data
- [x] Manual UI testing
- [x] Create project walkthrough and documentation
- [x] Deploy contracts to Fuji testnet
- [x] Register initial test agents
- [x] Push final codebase to Cyberpaisa/scan-erc-8004
- [x] Perform high-leverage system audit and risk assessment

## Phase 9: Architectural Hardening & CI Restoration
- [x] Update Prisma schema with `MetadataTask`
- [x] Implement `IndexerCursor` persistence in worker
- [x] Implement asynchronous metadata hydration loop
- [x] Add RPC retry logic and error handling
- [x] Setup GitHub Action for build verification
- [x] Fix strict CI failures (unused variables/imports)

- [x] Phase 10: Advanced Operations & Trust Persistence
    - [x] Implement `sentinel.ts` for periodic re-verification (Point 2)
    - [x] Integrate periodic scan cycle in worker loop
    - [x] Create API route for task auditing (Point 4)
    - [x] Build Frontend Audit Dashboard for `MetadataTask` monitoring
