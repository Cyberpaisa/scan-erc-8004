/**
 * Event Schemas - Typed event log parsing
 */

import { z } from 'zod';

// ==============================================
// IDENTITY REGISTRY EVENTS
// ==============================================

export const RegisteredEventSchema = z.object({
    agentId: z.bigint(),
    agentURI: z.string(),
    owner: z.string(),
});

export const URIUpdatedEventSchema = z.object({
    agentId: z.bigint(),
    newURI: z.string(),
    updatedBy: z.string(),
});

export const MetadataSetEventSchema = z.object({
    agentId: z.bigint(),
    metadataKey: z.string(),
    metadataValue: z.instanceof(Uint8Array),
});

// ==============================================
// REPUTATION REGISTRY EVENTS
// ==============================================

export const NewFeedbackEventSchema = z.object({
    agentId: z.bigint(),
    clientAddress: z.string(),
    feedbackIndex: z.bigint(),
    score: z.number().min(0).max(100),
    tag1: z.string(),
    tag2: z.string(),
    endpoint: z.string(),
    feedbackURI: z.string(),
    feedbackHash: z.string(),
});

export const FeedbackRevokedEventSchema = z.object({
    agentId: z.bigint(),
    clientAddress: z.string(),
    feedbackIndex: z.bigint(),
});

export const ResponseAppendedEventSchema = z.object({
    agentId: z.bigint(),
    clientAddress: z.string(),
    feedbackIndex: z.bigint(),
    responder: z.string(),
    responseURI: z.string(),
    responseHash: z.string(),
});

// ==============================================
// VALIDATION REGISTRY EVENTS
// ==============================================

export const ValidationRequestEventSchema = z.object({
    validatorAddress: z.string(),
    agentId: z.bigint(),
    requestURI: z.string(),
    requestHash: z.string(),
});

export const ValidationResponseEventSchema = z.object({
    validatorAddress: z.string(),
    agentId: z.bigint(),
    requestHash: z.string(),
    response: z.number().min(0).max(100),
    responseURI: z.string(),
    responseHash: z.string(),
    tag: z.string(),
});

// ==============================================
// TYPE EXPORTS
// ==============================================

export type RegisteredEvent = z.infer<typeof RegisteredEventSchema>;
export type URIUpdatedEvent = z.infer<typeof URIUpdatedEventSchema>;
export type MetadataSetEvent = z.infer<typeof MetadataSetEventSchema>;
export type NewFeedbackEvent = z.infer<typeof NewFeedbackEventSchema>;
export type FeedbackRevokedEvent = z.infer<typeof FeedbackRevokedEventSchema>;
export type ResponseAppendedEvent = z.infer<typeof ResponseAppendedEventSchema>;
export type ValidationRequestEvent = z.infer<typeof ValidationRequestEventSchema>;
export type ValidationResponseEvent = z.infer<typeof ValidationResponseEventSchema>;
