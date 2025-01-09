// ignition/modules/CrowdfundingModule.ts

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CrowdfundingModule = buildModule("CrowdfundingModule", (m) => {
  // Deploy the main platform contract
  const crowdfundingPlatform = m.contract("CrowdfundingPlatform");

  // You could also deploy an initial project for testing
  // Note: These would be example parameters
  const EXAMPLE_PROJECT = {
    title: "Example Project",
    description: "This is an example project for testing",
    fundingGoal: "10000000000000000000", // 10 ETH in wei
    durationInDays: 30,
    tokenName: "Example Project Token",
    tokenSymbol: "EPT"
  };

  // Optional: Create an initial project after deployment
  m.call(crowdfundingPlatform, "createProject", [
    EXAMPLE_PROJECT.title,
    EXAMPLE_PROJECT.description,
    EXAMPLE_PROJECT.fundingGoal,
    EXAMPLE_PROJECT.durationInDays,
    EXAMPLE_PROJECT.tokenName,
    EXAMPLE_PROJECT.tokenSymbol
  ], { id: "createExampleProject" });

  return { crowdfundingPlatform };
});

export default CrowdfundingModule;