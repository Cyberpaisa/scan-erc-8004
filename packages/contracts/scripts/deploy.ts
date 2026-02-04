import hre from "hardhat";

async function main() {
    const [deployer] = await hre.viem.getWalletClients();
    if (!deployer) {
        throw new Error("No deployer account found. Check your private key or network config.");
    }
    console.log("Deploying contracts with the account:", deployer.account.address);

    // Deploy IdentityRegistry
    const identity = await hre.viem.deployContract("IdentityRegistry");
    console.log("IdentityRegistry deployed to:", identity.address);

    // Deploy ReputationRegistry
    const reputation = await hre.viem.deployContract("ReputationRegistry");
    console.log("ReputationRegistry deployed to:", reputation.address);

    // Deploy ValidationRegistry
    const validation = await hre.viem.deployContract("ValidationRegistry", [identity.address]);
    console.log("ValidationRegistry deployed to:", validation.address);

    console.log("\nCopy these addresses to your .env file:");
    console.log(`IDENTITY_REGISTRY_ADDRESS=${identity.address}`);
    console.log(`REPUTATION_REGISTRY_ADDRESS=${reputation.address}`);
    console.log(`VALIDATION_REGISTRY_ADDRESS=${validation.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
