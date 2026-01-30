/**
 * Register Test Agents Script
 * 
 * This script registers sample agents on the Identity Registry for testing.
 * Run after deploying contracts: npx hardhat run scripts/register-agents.ts --network fuji
 */

import { ethers } from "hardhat";

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
    const [deployer] = await ethers.getSigners();

    console.log("=".repeat(60));
    console.log("Registering Test Agents");
    console.log("=".repeat(60));
    console.log("Deployer:", deployer.address);
    console.log("");

    // Get Identity Registry address from environment or hardcoded
    const identityAddress = process.env.IDENTITY_REGISTRY_ADDRESS;

    if (!identityAddress) {
        console.error("ERROR: IDENTITY_REGISTRY_ADDRESS not set");
        console.error("Please set it in .env or as environment variable");
        process.exit(1);
    }

    console.log("Identity Registry:", identityAddress);
    console.log("");

    // Get contract instance
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    const registry = IdentityRegistry.attach(identityAddress);

    // Register each agent
    for (let i = 0; i < TEST_AGENTS.length; i++) {
        const agent = TEST_AGENTS[i];
        console.log(`[${i + 1}/${TEST_AGENTS.length}] Registering: ${agent.name}`);

        try {
            const tx = await registry.register(agent.agentURI);
            const receipt = await tx.wait();

            // Find the Registered event to get the agentId
            const event = receipt?.logs.find((log: any) => {
                try {
                    const parsed = registry.interface.parseLog(log);
                    return parsed?.name === "Registered";
                } catch {
                    return false;
                }
            });

            if (event) {
                const parsed = registry.interface.parseLog(event);
                console.log(`    Agent ID: ${parsed?.args.agentId}`);
                console.log(`    TX: ${receipt?.hash}`);
            }

            console.log(`    Status: Success`);
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
