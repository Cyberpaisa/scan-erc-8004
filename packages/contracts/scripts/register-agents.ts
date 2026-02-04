/**
 * Register Test Agents Script
 * 
 * This script registers sample agents on the Identity Registry for testing.
 * Run after deploying contracts: npx hardhat run scripts/register-agents.ts --network fuji
 */

import hre from "hardhat";

interface TestAgent {
    name: string;
    description: string;
    agentURI: string;
}

const TEST_AGENTS: TestAgent[] = [
    {
        name: "Weather Oracle Agent",
        description: "Provides real-time weather data and forecasts for any location worldwide.",
        agentURI: `data:application/json;base64,${Buffer.from(JSON.stringify({
            name: "Weather Oracle Agent",
            description: "Provides real-time weather data and forecasts for any location worldwide.",
            image: "https://api.dicebear.com/7.x/bottts/svg?seed=weather",
            active: true,
            x402Support: true,
            services: [
                {
                    name: "A2A",
                    endpoint: "https://weather-agent.example.com/a2a",
                    version: "1.0.0"
                }
            ],
            supportedTrust: ["sentinel"]
        })).toString("base64")}`
    },
    {
        name: "DeFi Research Agent",
        description: "Analyzes DeFi protocols, yields, and risks across multiple chains.",
        agentURI: `data:application/json;base64,${Buffer.from(JSON.stringify({
            name: "DeFi Research Agent",
            description: "Analyzes DeFi protocols, yields, and risks across multiple chains.",
            image: "https://api.dicebear.com/7.x/bottts/svg?seed=defi",
            active: true,
            x402Support: true,
            services: [
                {
                    name: "MCP",
                    endpoint: "https://defi-agent.example.com/mcp",
                    version: "2.0.0"
                },
                {
                    name: "A2A",
                    endpoint: "https://defi-agent.example.com/a2a",
                    version: "1.0.0"
                }
            ],
            supportedTrust: ["sentinel", "zkml"]
        })).toString("base64")}`
    },
    {
        name: "Code Review Agent",
        description: "Automated code review and security analysis for smart contracts.",
        agentURI: `data:application/json;base64,${Buffer.from(JSON.stringify({
            name: "Code Review Agent",
            description: "Automated code review and security analysis for smart contracts.",
            image: "https://api.dicebear.com/7.x/bottts/svg?seed=code",
            active: true,
            x402Support: false,
            services: [
                {
                    name: "MCP",
                    endpoint: "https://code-agent.example.com/mcp",
                    version: "1.5.0"
                }
            ],
            supportedTrust: ["sentinel"]
        })).toString("base64")}`
    },
    {
        name: "Translation Agent",
        description: "Real-time translation between 50+ languages with context awareness.",
        agentURI: `data:application/json;base64,${Buffer.from(JSON.stringify({
            name: "Translation Agent",
            description: "Real-time translation between 50+ languages with context awareness.",
            image: "https://api.dicebear.com/7.x/bottts/svg?seed=translate",
            active: true,
            x402Support: true,
            services: [
                {
                    name: "A2A",
                    endpoint: "https://translate-agent.example.com/a2a",
                    version: "3.0.0"
                }
            ],
            supportedTrust: []
        })).toString("base64")}`
    },
    {
        name: "Supply Chain Agent",
        description: "Tracks and verifies supply chain data across global logistics networks.",
        agentURI: `data:application/json;base64,${Buffer.from(JSON.stringify({
            name: "Supply Chain Agent",
            description: "Tracks and verifies supply chain data across global logistics networks.",
            image: "https://api.dicebear.com/7.x/bottts/svg?seed=supply",
            active: false,
            x402Support: true,
            services: [
                {
                    name: "A2A",
                    endpoint: "https://supply-agent.example.com/a2a",
                    version: "1.0.0"
                },
                {
                    name: "MCP",
                    endpoint: "https://supply-agent.example.com/mcp",
                    version: "1.0.0"
                }
            ],
            supportedTrust: ["sentinel", "tee"]
        })).toString("base64")}`
    }
];

async function main() {
    const publicClient = await hre.viem.getPublicClient();
    const [walletClient] = await hre.viem.getWalletClients();

    if (!walletClient) throw new Error("No wallet account found");

    console.log("=".repeat(60));
    console.log("Registering Test Agents");
    console.log("=".repeat(60));
    console.log("Deployer:", walletClient.account.address);
    console.log("");

    const IDENTITY_REGISTRY_ADDRESS = process.env.IDENTITY_REGISTRY_ADDRESS as `0x${string}`;

    if (!IDENTITY_REGISTRY_ADDRESS) {
        console.error("ERROR: IDENTITY_REGISTRY_ADDRESS not set");
        process.exit(1);
    }

    console.log("Identity Registry:", IDENTITY_REGISTRY_ADDRESS);
    console.log("");

    const registry = await hre.viem.getContractAt(
        "IdentityRegistry",
        IDENTITY_REGISTRY_ADDRESS
    );

    console.log("\nStarting registration...");


    for (let i = 0; i < TEST_AGENTS.length; i++) {
        const agent = TEST_AGENTS[i];
        if (!agent) continue;

        console.log(`[${i + 1}/${TEST_AGENTS.length}] Registering: ${agent.name}`);

        try {
            // @ts-ignore - registry.write may be complex to infer in hardhat-viem
            const hash = await registry.write.register([agent.agentURI]);
            await publicClient.waitForTransactionReceipt({ hash });

            console.log(`    Status: Success`);
            console.log(`    TX: ${hash}`);
        } catch (error: any) {
            console.log(`    Status: Failed - ${error.message}`);
        }
        console.log("");
    }

    console.log("=".repeat(60));
    console.log("Registration complete");
    console.log("=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
