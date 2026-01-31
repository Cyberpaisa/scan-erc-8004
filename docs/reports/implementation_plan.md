# Architecture Hardening Plan

Improve system reliability and scalability by addressing critical architectural weaknesses identified in the audit.

## Proposed Changes

### [Database]
#### [MODIFY] [schema.prisma](file:///Users/jquiceva/.gemini/antigravity/playground/shadow-galaxy/packages/db/prisma/schema.prisma)
- Add `MetadataTask` model to handle asynchronous URI resolution (IPFS/Arweave).
- Add `TaskStatus` enum for background job tracking.

---

### [Worker Application]
#### [MODIFY] [main.ts](file:///Users/jquiceva/.gemini/antigravity/playground/shadow-galaxy/apps/worker/src/main.ts)
- Implement `IndexerCursor` persistence: read last block from DB on startup, save after each batch.
- Add RPC retry utility using `viem`'s built-in retry.
- Add `runPeriodicScanCycle` to the main loop to re-verify endpoints every 24h.

#### [MODIFY] [hydration.ts](file:///Users/jquiceva/.gemini/antigravity/playground/shadow-galaxy/apps/worker/src/hydration.ts)
- Refine background loop to process `MetadataTask` entries.

#### [NEW] [sentinel.ts](file:///Users/jquiceva/.gemini/antigravity/playground/shadow-galaxy/apps/worker/src/sentinel.ts)
- Logic to identify "stale" endpoints (last scanned > 24h) and trigger re-verification.

---

### [API & Web Dashboard]
#### [NEW] [tasks.ts](file:///Users/jquiceva/.gemini/antigravity/playground/shadow-galaxy/apps/api/src/routes/tasks.ts)
- API endpoint to fetch `MetadataTask` status, errors, and progress.

#### [NEW] [page.tsx](file:///Users/jquiceva/.gemini/antigravity/playground/shadow-galaxy/apps/web/app/tasks/page.tsx)
- Premium Audit Dashboard to monitor indexing health and resolution status.

---

### [CI/CD]
#### [NEW] [verify.yml](file:///Users/jquiceva/.gemini/antigravity/playground/shadow-galaxy/.github/workflows/verify.yml)
- GitHub Action to run `npm run typecheck` and `npm run build` on every push to `main`.

## Verification Plan

### Automated Tests
- Run `npm run typecheck` to ensure no regressions in type safety.
- Kill and restart the worker to verify it resumes from the last processed block in the DB.
- Simulate IPFS failure to verify `MetadataTask` retry logic and failure states.

### Manual Verification
- Register a new agent and observe the immediate creation of a `MetadataTask`.
- Monitor logs for RPC retry attempts during simulated network instability.
