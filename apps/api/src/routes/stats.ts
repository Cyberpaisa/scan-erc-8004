/**
 * Stats API Routes
 */

import { Router, type Request, type Response } from 'express';
import { db } from '@scanner/db';

export const statsRoutes = Router();

// ==============================================
// GET GLOBAL STATS
// ==============================================

statsRoutes.get('/', async (_req: Request, res: Response) => {
    try {
        const [
            totalAgents,
            activeAgents,
            x402Agents,
            totalFeedback,
            totalValidations,
            totalEndpoints,
            protocolStats,
            x402Stats,
        ] = await Promise.all([
            db.agent.count(),
            db.agent.count({ where: { active: true } }),
            db.agent.count({ where: { x402Support: true } }),
            db.feedback.count(),
            db.validation.count(),
            db.endpoint.count(),
            db.endpoint.groupBy({
                by: ['name'],
                _count: { name: true },
                orderBy: { _count: { name: 'desc' } },
                take: 10,
            }),
            db.agent.aggregate({
                _sum: {
                    totalVolume: true,
                    txCount: true,
                }
            })
        ]);

        const totalNetworkVolume = (x402Stats as any)._sum.totalVolume || BigInt(0);
        const totalNetworkTxs = (x402Stats as any)._sum.txCount || 0;

        res.json({
            agents: {
                total: totalAgents,
                active: activeAgents,
                x402Enabled: x402Agents,
            },
            feedback: {
                total: totalFeedback,
            },
            validations: {
                total: totalValidations,
            },
            endpoints: {
                total: totalEndpoints,
                byProtocol: protocolStats.map((p: any) => ({
                    protocol: p.name,
                    count: p._count.name,
                })),
            },
            network: {
                totalVolume: totalNetworkVolume.toString(),
                totalTransactions: totalNetworkTxs,
            }
        });
        return;
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
        return;
    }
});

// ==============================================
// GET RECENT ACTIVITY
// ==============================================

statsRoutes.get('/activity', async (req: Request, res: Response) => {
    try {
        const { limit = '10' } = req.query;
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

        const [recentAgents, recentFeedback, recentValidations] = await Promise.all([
            db.agent.findMany({
                select: {
                    id: true,
                    agentId: true,
                    name: true,
                    registeredAt: true,
                },
                orderBy: { registeredAt: 'desc' },
                take: limitNum,
            }),
            db.feedback.findMany({
                select: {
                    id: true,
                    agentId: true,
                    clientAddress: true,
                    score: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limitNum,
            }),
            db.validation.findMany({
                select: {
                    id: true,
                    agentId: true,
                    validatorAddress: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: limitNum,
            }),
        ]);

        res.json({
            recentAgents: recentAgents.map((a: any) => ({
                ...a,
                agentId: a.agentId.toString(),
            })),
            recentFeedback: recentFeedback.map((f: any) => ({
                ...f,
                agentId: f.agentId.toString(),
            })),
            recentValidations: recentValidations.map((v: any) => ({
                ...v,
                agentId: v.agentId.toString(),
            })),
        });
        return;
    } catch (error) {
        console.error('Error getting activity:', error);
        res.status(500).json({ error: 'Failed to get activity' });
        return;
    }
});
