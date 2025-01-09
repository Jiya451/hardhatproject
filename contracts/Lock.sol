// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Token contract for project rewards
contract ProjectToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) 
        ERC20(name, symbol)
    {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

// Main crowdfunding platform contract
contract CrowdfundingPlatform is ReentrancyGuard {
    struct Project {
        address creator;
        string title;
        string description;
        uint256 fundingGoal;
        uint256 deadline;
        uint256 totalFunds;
        bool funded;
        bool claimed;
        ProjectToken rewardToken;
        mapping(address => uint256) contributions;
    }

    uint256 public projectCount;
    mapping(uint256 => Project) public projects;
    
    // Events
    event ProjectCreated(uint256 indexed projectId, address creator, uint256 fundingGoal, uint256 deadline);
    event ContributionMade(uint256 indexed projectId, address contributor, uint256 amount);
    event FundsClaimed(uint256 indexed projectId, address creator, uint256 amount);
    event RefundClaimed(uint256 indexed projectId, address contributor, uint256 amount);

    // Create a new project
    function createProject(
        string memory title,
        string memory description,
        uint256 fundingGoal,
        uint256 durationInDays,
        string memory tokenName,
        string memory tokenSymbol
    ) external returns (uint256) {
        require(fundingGoal > 0, "Funding goal must be greater than 0");
        require(durationInDays > 0, "Duration must be greater than 0");

        uint256 projectId = projectCount;
        projectCount++; // Increment the projectCount after using it

        Project storage project = projects[projectId];
        
        project.creator = msg.sender;
        project.title = title;
        project.description = description;
        project.fundingGoal = fundingGoal;
        project.deadline = block.timestamp + (durationInDays * 1 days);
        project.rewardToken = new ProjectToken(tokenName, tokenSymbol);

        emit ProjectCreated(projectId, msg.sender, fundingGoal, project.deadline);
        return projectId;
    }

    // Contribute to a project
    function contribute(uint256 projectId) external payable nonReentrant {
        Project storage project = projects[projectId];
        require(block.timestamp < project.deadline, "Project funding period has ended");
        require(!project.funded, "Project already funded");
        require(msg.value > 0, "Contribution must be greater than 0");

        project.contributions[msg.sender] += msg.value;
        project.totalFunds += msg.value;

        // Mint reward tokens proportional to contribution
        uint256 tokenAmount = (msg.value * 1000) / (1 ether); // 1000 tokens per ETH
        project.rewardToken.mint(msg.sender, tokenAmount);

        emit ContributionMade(projectId, msg.sender, msg.value);

        if (project.totalFunds >= project.fundingGoal) {
            project.funded = true;
        }
    }

    // Creator claims funds if goal is reached
    function claimFunds(uint256 projectId) external nonReentrant {
        Project storage project = projects[projectId];
        require(msg.sender == project.creator, "Only creator can claim funds");
        require(project.funded, "Project not funded");
        require(!project.claimed, "Funds already claimed");
        require(block.timestamp >= project.deadline, "Funding period not ended");

        project.claimed = true;
        payable(project.creator).transfer(project.totalFunds);

        emit FundsClaimed(projectId, project.creator, project.totalFunds);
    }

    // Contributors can claim refund if goal not reached
    function claimRefund(uint256 projectId) external nonReentrant {
        Project storage project = projects[projectId];
        require(block.timestamp >= project.deadline, "Funding period not ended");
        require(!project.funded, "Project was funded");
        
        uint256 contribution = project.contributions[msg.sender];
        require(contribution > 0, "No contribution found");
        
        project.contributions[msg.sender] = 0;
        payable(msg.sender).transfer(contribution);

        emit RefundClaimed(projectId, msg.sender, contribution);
    }

    // View functions
    function getProject(uint256 projectId) external view returns (
        address creator,
        string memory title,
        string memory description,
        uint256 fundingGoal,
        uint256 deadline,
        uint256 totalFunds,
        bool funded,
        bool claimed,
        address tokenAddress
    ) {
        Project storage project = projects[projectId];
        return (
            project.creator,
            project.title,
            project.description,
            project.fundingGoal,
            project.deadline,
            project.totalFunds,
            project.funded,
            project.claimed,
            address(project.rewardToken)
        );
    }

    function getContribution(uint256 projectId, address contributor) external view returns (uint256) {
        return projects[projectId].contributions[contributor];
    }
}
