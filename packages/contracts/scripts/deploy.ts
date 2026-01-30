import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    if (!deployer) throw new Error('No deployer account found');

    console.log('Deploying ERC-8004 contracts with account:', deployer.address);
    console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString());

    const network = await ethers.provider.getNetwork();
    console.log('Network:', network.name, '- Chain ID:', network.chainId);

    // Deploy Identity Registry
    console.log('\n1. Deploying IdentityRegistry...');
    const IdentityRegistry = await ethers.getContractFactory('IdentityRegistry');
    const identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();
    const identityAddress = await identityRegistry.getAddress();
    console.log('   IdentityRegistry deployed to:', identityAddress);

    // Deploy Reputation Registry
    console.log('\n2. Deploying ReputationRegistry...');
    const ReputationRegistry = await ethers.getContractFactory('ReputationRegistry');
    const reputationRegistry = await ReputationRegistry.deploy(identityAddress);
    await reputationRegistry.waitForDeployment();
    const reputationAddress = await reputationRegistry.getAddress();
    console.log('   ReputationRegistry deployed to:', reputationAddress);

    // Deploy Validation Registry
    console.log('\n3. Deploying ValidationRegistry...');
    const ValidationRegistry = await ethers.getContractFactory('ValidationRegistry');
    const validationRegistry = await ValidationRegistry.deploy(identityAddress);
    await validationRegistry.waitForDeployment();
    const validationAddress = await validationRegistry.getAddress();
    console.log('   ValidationRegistry deployed to:', validationAddress);

    // Summary
    console.log('\n========================================');
    console.log('DEPLOYMENT COMPLETE');
    console.log('========================================');
    console.log('Network:', network.name);
    console.log('Chain ID:', network.chainId);
    console.log('');
    console.log('Contract Addresses:');
    console.log('  IDENTITY_REGISTRY_ADDRESS=' + identityAddress);
    console.log('  REPUTATION_REGISTRY_ADDRESS=' + reputationAddress);
    console.log('  VALIDATION_REGISTRY_ADDRESS=' + validationAddress);
    console.log('========================================');

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        chainId: Number(network.chainId),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            identityRegistry: identityAddress,
            reputationRegistry: reputationAddress,
            validationRegistry: validationAddress,
        },
    };

    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `deployment-${network.chainId}-${Date.now()}.json`;
    fs.writeFileSync(
        path.join(deploymentsDir, filename),
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log('\nDeployment info saved to:', filename);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
