const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdfundingPlatform", function () {
  let CrowdfundingPlatform, platform;
  let owner, creator, contributor1, contributor2;
  let projectId;

  const PROJECT_TITLE = "Test Project";
  const PROJECT_DESCRIPTION = "A test project description";
  const FUNDING_GOAL = ethers.parseEther("10");
  const DURATION_DAYS = 30;
  const TOKEN_NAME = "Test Token";
  const TOKEN_SYMBOL = "TEST";

  beforeEach(async function () {
    [owner, creator, contributor1, contributor2] = await ethers.getSigners();

    CrowdfundingPlatform = await ethers.getContractFactory("CrowdfundingPlatform");
    platform = await CrowdfundingPlatform.deploy();
    await platform.waitForDeployment();

    // Create a test project
    const tx = await platform.connect(creator).createProject(
      PROJECT_TITLE,
      PROJECT_DESCRIPTION,
      FUNDING_GOAL,
      DURATION_DAYS,
      TOKEN_NAME,
      TOKEN_SYMBOL
    );
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === 'ProjectCreated');
    projectId = event.args.projectId;
  });

  describe("Project Creation", function () {
    it("Should create a project with correct parameters", async function () {
      const project = await platform.getProject(projectId);
      
      expect(project.creator).to.equal(creator.address);
      expect(project.title).to.equal(PROJECT_TITLE);
      expect(project.description).to.equal(PROJECT_DESCRIPTION);
      expect(project.fundingGoal).to.equal(FUNDING_GOAL);
      expect(project.totalFunds).to.equal(0);
      expect(project.funded).to.be.false;
      expect(project.claimed).to.be.false;
    });

    it("Should not create a project with zero funding goal", async function () {
      await expect(
        platform.createProject(
          PROJECT_TITLE,
          PROJECT_DESCRIPTION,
          0,
          DURATION_DAYS,
          TOKEN_NAME,
          TOKEN_SYMBOL
        )
      ).to.be.revertedWith("Funding goal must be greater than 0");
    });
  });

  describe("Contributing", function () {
    it("Should accept contributions and mint reward tokens", async function () {
      const contribution = ethers.parseEther("1");
      await platform.connect(contributor1).contribute(projectId, { value: contribution });

      const projectContribution = await platform.getContribution(projectId, contributor1.address);
      expect(projectContribution).to.equal(contribution);

      const project = await platform.getProject(projectId);
      const tokenContract = await ethers.getContractAt("ProjectToken", project.tokenAddress);
      const tokenBalance = await tokenContract.balanceOf(contributor1.address);
      expect(tokenBalance).to.equal(1000); // 1000 tokens per ETH
    });

    it("Should mark project as funded when goal is reached", async function () {
      await platform.connect(contributor1).contribute(projectId, { value: FUNDING_GOAL });
      
      const project = await platform.getProject(projectId);
      expect(project.funded).to.be.true;
    });
  });

  describe("Fund Claiming", function () {
    beforeEach(async function () {
      await platform.connect(contributor1).contribute(projectId, { value: FUNDING_GOAL });
    });

    it("Should allow creator to claim funds after deadline", async function () {
      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [DURATION_DAYS * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const initialBalance = await ethers.provider.getBalance(creator.address);
      await platform.connect(creator).claimFunds(projectId);
      const finalBalance = await ethers.provider.getBalance(creator.address);

      expect(finalBalance - initialBalance).to.be.closeTo(
        FUNDING_GOAL,
        ethers.parseEther("0.01") // Allow for gas costs
      );
    });

    it("Should not allow non-creator to claim funds", async function () {
      await ethers.provider.send("evm_increaseTime", [DURATION_DAYS * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await expect(
        platform.connect(contributor1).claimFunds(projectId)
      ).to.be.revertedWith("Only creator can claim funds");
    });
  });

  describe("Refunds", function () {
    it("Should allow refunds if goal not met", async function () {
      const contribution = ethers.parseEther("1");
      await platform.connect(contributor1).contribute(projectId, { value: contribution });

      // Fast forward time past deadline
      await ethers.provider.send("evm_increaseTime", [DURATION_DAYS * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const initialBalance = await ethers.provider.getBalance(contributor1.address);
      await platform.connect(contributor1).claimRefund(projectId);
      const finalBalance = await ethers.provider.getBalance(contributor1.address);

      expect(finalBalance - initialBalance).to.be.closeTo(
        contribution,
        ethers.parseEther("0.01") // Allow for gas costs
      );
    });

    it("Should not allow refunds if goal met", async function () {
      await platform.connect(contributor1).contribute(projectId, { value: FUNDING_GOAL });
      
      await ethers.provider.send("evm_increaseTime", [DURATION_DAYS * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await expect(
        platform.connect(contributor1).claimRefund(projectId)
      ).to.be.revertedWith("Project was funded");
    });
  });
});