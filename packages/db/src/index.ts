/**
 * Database Package - Entry Point
 * Re-exports Prisma client and types
 */

export * from '@prisma/client';
export { db } from './client.js';
export type { Agent, Endpoint, Feedback, Validation, EndpointScan } from '@prisma/client';
