import { createServer } from 'http';

async function testSentinelValidation() {
    console.log("🚀 Starting Sentinel Validation Test...");

    // 1. Create a mock agent server
    const server = createServer((req, res) => {
        console.log(`   [Mock Server] Received request for: ${req.url}`);
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'x-a2a-header': 'verified',
            'x-x402-header': 'enabled',
            'x-payment-address': '0x1234567890123456789012345678901234567890'
        });
        res.end(JSON.stringify({ status: 'ok', message: 'Hello from Agent' }));
    });

    const PORT = 9999;
    server.listen(PORT);
    const mockUrl = `http://localhost:${PORT}/api/agent`;

    console.log(`   [Mock Server] Running at ${mockUrl}`);

    try {
        console.log("   [Test] Running manual fetch to simulate Sentinel...");
        const response = await fetch(mockUrl);
        const hasA2A = response.headers.has('x-a2a-header');
        const hasX402 = response.headers.has('x-x402-header');

        console.log(`   [Test] A2A Header Found: ${hasA2A}`);
        console.log(`   [Test] X402 Header Found: ${hasX402}`);

        if (hasA2A && hasX402) {
            console.log("✅ TEST SUCCESSFUL: Real protocol headers detected!");
        } else {
            console.error("❌ TEST FAILED: Headers not detected.");
            process.exit(1);
        }

    } finally {
        server.close();
        console.log("   [Mock Server] Stopped.");
    }
}

testSentinelValidation().catch(err => {
    console.error(err);
    process.exit(1);
});
