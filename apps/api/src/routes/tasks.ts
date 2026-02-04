import { Router, Request, Response } from 'express';
import { db } from '@scanner/db';

// Global BigInt to JSON conversion
// This is critical for data-heavy on-chain applications
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const taskRoutes = Router();

/**
 * GET /api/v1/tasks
 * List background metadata hydration tasks
 */
taskRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const { status, limit = '50', page = '1' } = req.query;

        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 50;
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const [tasks, total] = await Promise.all([
            db.metadataTask.findMany({
                where,
                include: {
                    agent: {
                        select: {
                            name: true,
                            agentId: true,
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limitNum,
            }),
            db.metadataTask.count({ where }),
        ]);

        res.json({
            data: tasks.map((t: any) => ({
                ...t,
                agentId: t.agentId.toString(),
                agent: t.agent ? {
                    ...t.agent,
                    agentId: t.agent.agentId.toString()
                } : null
            })),
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            }
        });
        Broadway:
        return;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

/**
 * GET /api/v1/tasks/scans
 * List Sentinel compliance scan jobs
 */
taskRoutes.get('/scans', async (req: Request, res: Response) => {
    try {
        const { status, limit = '50', page = '1' } = req.query;
        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 50;
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (status) where.status = status;

        const [scans, total] = await Promise.all([
            db.scanJob.findMany({
                where,
                include: {
                    endpoint: {
                        select: { name: true }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limitNum,
            }),
            db.scanJob.count({ where }),
        ]);

        res.json({
            data: scans.map((s: any) => ({
                ...s,
                agentId: s.agentId.toString(),
            })),
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            }
        });
        return;
    } catch (error) {
        console.error('Error fetching scans:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

/**
 * GET /api/v1/tasks/stats
 * Get unified task processing statistics
 */
taskRoutes.get('/stats', async (_req: Request, res: Response) => {
    try {
        const [metadataStats, scanStats] = await Promise.all([
            db.metadataTask.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            db.scanJob.groupBy({
                by: ['status'],
                _count: { status: true },
            })
        ]);

        const format = (stats: any[]) => {
            const formatted = { total: 0, pending: 0, processing: 0, completed: 0, failed: 0 };
            stats.forEach((s: any) => {
                const count = s._count.status;
                formatted.total += count;
                if (s.status === 'PENDING') formatted.pending = count;
                if (s.status === 'PROCESSING') formatted.processing = count;
                if (s.status === 'COMPLETED' || s.status === 'SUCCESS') formatted.completed = count;
                if (s.status === 'FAILED') formatted.failed = count;
            });
            return formatted;
        };

        res.json({
            metadata: format(metadataStats),
            scans: format(scanStats)
        });
        return;
    } catch (error) {
        console.error('Error fetching task stats:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

export { taskRoutes };
