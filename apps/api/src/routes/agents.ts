/**
 * Agent API Routes
 */

import { Router, type Request, type Response } from 'express';
import { db } from '@scanner/db';

export const agentRoutes = Router();

// ==============================================
// LIST AGENTS
// ==============================================

agentRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '20',
            search,
            active,
            x402,
            protocol,
            sortBy = 'registeredAt',
            sortOrder = 'desc',
        } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        if (active === 'true') {
            where.active = true;
        }

        if (x402 === 'true') {
            where.x402Support = true;
        }

        if (protocol) {
            where.endpoints = {
                some: {
                    name: { equals: protocol as string, mode: 'insensitive' },
                },
            };
        }

        // Query
        const [agents, total] = await Promise.all([
            db.agent.findMany({
                where,
                include: {
                    endpoints: {
                        select: {
                            id: true,
                            name: true,
                            endpoint: true,
                            version: true,
                            isVerified: true,
                        },
                    },
                    _count: {
                        select: {
                            feedback: true,
                            validationsAsAgent: true,
                        },
                    },
                },
                orderBy: { [sortBy as string]: sortOrder },
                skip,
                take: limitNum,
            }),
            db.agent.count({ where }),
        ]);

        // Transform response
        const data = agents.map(agent => ({
            id: agent.id,
            agentId: agent.agentId.toString(),
            chainId: agent.chainId,
            registryAddress: agent.registryAddress,
            ownerAddress: agent.ownerAddress,
            name: agent.name,
            description: agent.description,
            image: agent.image,
            active: agent.active,
            x402Support: agent.x402Support,
            supportedTrust: agent.supportedTrust,
            agentHash: agent.agentHash,
            endpoints: agent.endpoints,
            feedbackCount: agent._count.feedback,
            validationCount: agent._count.validationsAsAgent,
            registeredAt: agent.registeredAt,
            lastIndexedAt: agent.lastIndexedAt,
        }));

        res.json({
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error listing agents:', error);
        res.status(500).json({ error: 'Failed to list agents' });
    }
});

// ==============================================
// GET AGENT BY ID
// ==============================================

agentRoutes.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Try to find by agentId (on-chain ID) first, then by database id
        let agent;
        const numericId = parseInt(id!, 10);

        if (!isNaN(numericId)) {
            agent = await db.agent.findFirst({
                where: {
                    OR: [
                        { id: numericId },
                        { agentId: BigInt(numericId) },
                    ],
                },
                include: {
                    endpoints: true,
                    metadataEntries: true,
                    scans: {
                        orderBy: { scannedAt: 'desc' },
                        take: 10,
                    },
                },
            });
        }

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.json({
            id: agent.id,
            agentId: agent.agentId.toString(),
            chainId: agent.chainId,
            registryAddress: agent.registryAddress,
            ownerAddress: agent.ownerAddress,
            agentURI: agent.agentURI,
            name: agent.name,
            description: agent.description,
            image: agent.image,
            active: agent.active,
            x402Support: agent.x402Support,
            supportedTrust: agent.supportedTrust,
            agentHash: agent.agentHash,
            agentWallet: agent.agentWallet,
            endpoints: agent.endpoints,
            metadata: agent.metadataEntries.map(m => ({
                key: m.metadataKey,
                value: m.metadataValue.toString('hex'),
            })),
            recentScans: agent.scans,
            registeredAt: agent.registeredAt,
            registeredBlock: agent.registeredBlock.toString(),
            registeredTx: agent.registeredTx,
            lastIndexedAt: agent.lastIndexedAt,
            lastHydratedAt: agent.lastHydratedAt,
        });
    } catch (error) {
        console.error('Error getting agent:', error);
        res.status(500).json({ error: 'Failed to get agent' });
    }
});

// ==============================================
// GET AGENT FEEDBACK
// ==============================================

agentRoutes.get('/:id/feedback', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '20' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

        const numericId = parseInt(id!, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ error: 'Invalid agent ID' });
        }

        // Find agent
        const agent = await db.agent.findFirst({
            where: {
                OR: [
                    { id: numericId },
                    { agentId: BigInt(numericId) },
                ],
            },
        });

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const [feedback, total] = await Promise.all([
            db.feedback.findMany({
                where: { agentId: agent.agentId },
                include: {
                    responses: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
            db.feedback.count({ where: { agentId: agent.agentId } }),
        ]);

        // Calculate average score
        const avgScore = await db.feedback.aggregate({
            where: { agentId: agent.agentId, isRevoked: false },
            _avg: { score: true },
            _count: { score: true },
        });

        res.json({
            data: feedback.map(f => ({
                id: f.id,
                clientAddress: f.clientAddress,
                feedbackIndex: f.feedbackIndex.toString(),
                score: f.score,
                tag1: f.tag1,
                tag2: f.tag2,
                targetEndpoint: f.targetEndpoint,
                feedbackURI: f.feedbackURI,
                isRevoked: f.isRevoked,
                responses: f.responses,
                createdAt: f.createdAt,
            })),
            summary: {
                averageScore: avgScore._avg.score ?? 0,
                totalFeedback: avgScore._count.score,
            },
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error getting feedback:', error);
        res.status(500).json({ error: 'Failed to get feedback' });
    }
});

// ==============================================
// GET AGENT VALIDATIONS
// ==============================================

agentRoutes.get('/:id/validations', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { page = '1', limit = '20' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

        const numericId = parseInt(id!, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ error: 'Invalid agent ID' });
        }

        // Find agent
        const agent = await db.agent.findFirst({
            where: {
                OR: [
                    { id: numericId },
                    { agentId: BigInt(numericId) },
                ],
            },
        });

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const [validations, total] = await Promise.all([
            db.validation.findMany({
                where: { agentId: agent.agentId },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
            db.validation.count({ where: { agentId: agent.agentId } }),
        ]);

        res.json({
            data: validations.map(v => ({
                id: v.id,
                validatorAddress: v.validatorAddress,
                requestHash: v.requestHash,
                requestURI: v.requestURI,
                response: v.response,
                responseURI: v.responseURI,
                responseTag: v.responseTag,
                status: v.status,
                lastUpdate: v.lastUpdate,
                createdAt: v.createdAt,
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error getting validations:', error);
        res.status(500).json({ error: 'Failed to get validations' });
    }
});
