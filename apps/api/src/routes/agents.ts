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
                            a2aVerified: true,
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
        const data = agents.map((agent: any) => ({
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
            isA2AVerified: agent.isA2AVerified,
            complianceScore: agent.complianceScore,
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
        return;
    } catch (error) {
        console.error('Error listing agents:', error);
        res.status(500).json({ error: 'Failed to list agents' });
        return;
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
        const numericId = parseInt(id as string, 10);

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
            res.status(404).json({ error: 'Agent not found' });
            return;
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
            isA2AVerified: agent.isA2AVerified,
            complianceScore: agent.complianceScore,
            supportedTrust: agent.supportedTrust,
            agentHash: agent.agentHash,
            agentWallet: agent.agentWallet,
            endpoints: agent.endpoints,
            metadata: agent.metadataEntries.map((m: any) => ({
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
        return;
    } catch (error) {
        console.error('Error getting agent:', error);
        res.status(500).json({ error: 'Failed to get agent' });
        return;
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

        const numericId = parseInt(id as string, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ error: 'Invalid agent ID' });
            return;
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
            res.status(404).json({ error: 'Agent not found' });
            return;
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
            data: feedback.map((f: any) => ({
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
        return;
    } catch (error) {
        console.error('Error getting feedback:', error);
        res.status(500).json({ error: 'Failed to get feedback' });
        return;
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

        const numericId = parseInt(id as string, 10);
        if (isNaN(numericId)) {
            res.status(400).json({ error: 'Invalid agent ID' });
            return;
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
            res.status(404).json({ error: 'Agent not found' });
            return;
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
            data: validations.map((v: any) => ({
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
        return;
    } catch (error) {
        console.error('Error getting validations:', error);
        res.status(500).json({ error: 'Failed to get validations' });
        return;
    }
});

// ==============================================
// CREATE AGENT (Ralph Method Manual Entry)
// ==============================================
agentRoutes.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description, image, endpoints, x402Support, agentId } = req.body;

        if (!name || (agentId === undefined && !name)) {
            res.status(400).json({ error: 'Name and Agent ID are required' });
            return;
        }

        const agent = await db.agent.create({
            data: {
                agentId: BigInt(agentId || Math.floor(Math.random() * 1000000)),
                name,
                description,
                image,
                x402Support: !!x402Support,
                active: true,
                complianceScore: 0,
                registryAddress: '0xLocalManualEntry',
                ownerAddress: '0x1234567890123456789012345678901234567890',
                chainId: 43113,
                registeredBlock: BigInt(0),
                registeredTx: '0xmanual',
                endpoints: {
                    create: (endpoints || []).map((ep: any) => ({
                        name: ep.name,
                        endpoint: ep.url,
                    })),
                },
            },
        });

        res.status(201).json({
            ...agent,
            agentId: agent.agentId.toString(),
            registeredBlock: agent.registeredBlock.toString(),
        });
        return;
    } catch (error: any) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: error.message || 'Failed to create agent' });
        return;
    }
});

// ==============================================
// VALIDATE AGENT (On-Demand)
// ==============================================
agentRoutes.post('/:id/validate', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const numericId = parseInt(id as string, 10);

        const agent = await db.agent.findFirst({
            where: {
                OR: [{ id: numericId }, { agentId: BigInt(numericId) }],
            },
            include: { endpoints: true },
        });

        if (!agent) {
            res.status(404).json({ error: 'Agent not found' });
            return;
        }

        // Explicitly create a ScanJob (On-Demand)
        const existingJob = await db.scanJob.findFirst({
            where: {
                endpointId: agent.endpoints[0]?.id,
                status: { in: ['PENDING', 'PROCESSING'] }
            }
        });

        if (!existingJob && agent.endpoints[0]) {
            await db.scanJob.create({
                data: {
                    agentId: agent.agentId,
                    endpointId: agent.endpoints[0].id,
                    url: agent.endpoints[0].endpoint,
                    status: 'PENDING',
                    nextRunAt: new Date(), // Run immediately
                }
            });
        }

        res.json({
            message: 'Validation queued.',
            agentId: agent.agentId.toString(),
            status: existingJob ? 'Already in queue' : 'Created'
        });
        return;
    } catch (error: any) {
        console.error('Error triggering validation:', error);
        res.status(500).json({ error: 'Failed to trigger validation' });
        return;
    }
});
