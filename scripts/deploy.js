// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
    // 1. Get the contract factory
    const CrowdfundingPlatform = await ethers.getContractFactory("CrowdfundingPlatform");
    console.log("Deploying CrowdfundingPlatform contract...");

    // 2. Deploy the contract
    const crowdfundingPlatform = await CrowdfundingPlatform.deploy();
    await crowdfundingPlatform.deployed();

    // 3. Log the deployed contract address
    console.log("CrowdfundingPlatform deployed to:", crowdfundingPlatform.address);
}

// For async/await error handling
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });