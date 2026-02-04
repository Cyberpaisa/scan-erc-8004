/**
 * API Server - Main Entry Point
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from '@scanner/db';
import { agentRoutes } from './routes/agents.js';
import { statsRoutes } from './routes/stats.js';
import { taskRoutes } from './routes/tasks.js';

// BigInt Serialization fix for Express
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();
const PORT = process.env.API_PORT ?? 3001;
const HOST = process.env.API_HOST ?? '0.0.0.0';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (_req, res) => {
    try {
        await db.$queryRaw`SELECT 1`;
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/tasks', taskRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(Number(PORT), HOST, () => {
    console.log('=====================================');
    console.log('ERC-8004 Agent Scanner API');
    console.log('=====================================');
    console.log(`Server running at http://${HOST}:${PORT}`);
    console.log('=====================================');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await db.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await db.$disconnect();
    process.exit(0);
});
