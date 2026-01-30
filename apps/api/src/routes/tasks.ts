import { Router, Request, Response } from 'express';
import { db } from '@scanner/db';

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
            data: tasks.map(t => ({
                ...t,
                agentId: t.agentId.toString(),
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
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

/**
 * GET /api/v1/tasks/stats
 * Get task processing statistics
 */
taskRoutes.get('/stats', async (_req: Request, res: Response) => {
    try {
        const stats = await db.metadataTask.groupBy({
            by: ['status'],
            _count: { status: true },
        });

        const formattedStats = {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
        };

        stats.forEach((s: any) => {
            const count = s._count.status;
            formattedStats.total += count;
            if (s.status === 'PENDING') formattedStats.pending = count;
            if (s.status === 'PROCESSING') formattedStats.processing = count;
            if (s.status === 'COMPLETED') formattedStats.completed = count;
            if (s.status === 'FAILED') formattedStats.failed = count;
        });

        res.json(formattedStats);
        return;
    } catch (error) {
        console.error('Error fetching task stats:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

export { taskRoutes };
