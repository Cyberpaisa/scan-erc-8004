import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Shadow-Galaxy (Local Mode)...');

    // Create a high-trust agent
    const agent1 = await (prisma.agent as any).upsert({
        where: { agentId: BigInt(1) },
        update: {},
        create: {
            agentId: BigInt(1),
            chainId: 43113,
            registryAddress: '0x2f7134e0e0eb7062D99De95d13593735B8634647',
            ownerAddress: '0x1234567890123456789012345678901234567890',
            name: 'Sentinel Prime Agent',
            description: 'The first AI agent certified by Shadow-Galaxy Chamber of Commerce. Specialized in high-trust remesas and A2A transactions.',
            image: 'https://img.freepik.com/premium-photo/futuristic-robot-head-neon-colors-black-background_935619-2780.jpg',
            active: true,
            isA2AVerified: true,
            complianceScore: 98,
            x402Support: true,
            registeredBlock: BigInt(1000),
            registeredTx: '0xabc123...',
        } as any,
    });

    // Create a medium-trust agent
    const agent2 = await (prisma.agent as any).upsert({
        where: { agentId: BigInt(2) },
        update: {},
        create: {
            agentId: BigInt(2),
            chainId: 43113,
            registryAddress: '0x2f7134e0e0eb7062D99De95d13593735B8634647',
            ownerAddress: '0x0987654321098765432109876543210987654321',
            name: 'Alpha Trader Bot',
            description: 'Automated DeFi trading agent. Fast but currently undergoing security re-verification.',
            image: 'https://img.freepik.com/premium-vector/abstract-technology-robotic-humanoid-head-background_103342-99.jpg',
            active: true,
            isA2AVerified: false,
            complianceScore: 65,
            x402Support: true,
            registeredBlock: BigInt(1005),
            registeredTx: '0xdef456...',
        } as any,
    });

    // Associate endpoints
    await (prisma.endpoint as any).upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            agentId: agent1.agentId,
            name: 'A2A API',
            endpoint: 'https://api.sentinel-prime.io/a2a',
            isVerified: true,
            a2aVerified: true,
            tlsValid: true,
            dnsValid: true,
        } as any,
    });

    await (prisma.endpoint as any).upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            agentId: agent2.agentId,
            name: 'Public RPC',
            endpoint: 'http://alpha-trader.net/rpc',
            isVerified: false,
            a2aVerified: false,
            tlsValid: false, // http
            dnsValid: true,
        } as any,
    });

    // Create Tasks for Dashboard
    console.log('📝 Creating background tasks...');
    await (prisma as any).metadataTask.deleteMany({}); // Clear old tasks
    await (prisma as any).metadataTask.createMany({
        data: [
            {
                agentId: agent1.agentId,
                uri: 'ipfs://QmAgent1',
                status: 'COMPLETED',
                type: 'AGENT_METADATA',
                attempts: 1,
            },
            {
                agentId: agent2.agentId,
                uri: 'ipfs://QmAgent2',
                status: 'FAILED',
                type: 'AGENT_METADATA',
                attempts: 5,
                lastError: 'Gateway Timeout: IPFS pin missing',
            },
            {
                agentId: agent2.agentId,
                uri: 'https://metadata.alpha-trader.net',
                status: 'PROCESSING',
                type: 'AGENT_METADATA',
                attempts: 2,
            },
        ],
    });

    // Create Feedback
    console.log('💬 Creating feedback entries...');
    await (prisma as any).feedback.deleteMany({}); // Clear old feedback
    await (prisma as any).feedback.createMany({
        data: [
            {
                agentId: agent1.agentId,
                clientAddress: '0x1234567890123456789012345678901234567890',
                feedbackIndex: BigInt(0),
                score: 95,
                tag1: 'Fast',
                tag2: 'Secure',
                createdBlock: BigInt(2000),
                createdTx: '0xfeed123...',
            },
            {
                agentId: agent1.agentId,
                clientAddress: '0x0987654321098765432109876543210987654321',
                feedbackIndex: BigInt(1),
                score: 88,
                tag1: 'Reliable',
                createdBlock: BigInt(2010),
                createdTx: '0xfeed456...',
            },
        ]
    });

    // Create Validations
    console.log('🛡️ Creating validation entries...');
    await (prisma as any).validation.deleteMany({});
    await (prisma as any).validation.create({
        data: {
            agentId: agent2.agentId,
            validatorAddress: '0xValidatorAlpha',
            requestURI: 'ipfs://QmValidationReq',
            requestHash: '0xhash123',
            status: 'FAILED',
            requestedBlock: BigInt(1500),
            requestedTx: '0xval123',
        } as any,
    });

    console.log('✅ Local database seeded with Ralph-level fidelity!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
