require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/InR6QE9UbummkQ-DWwlFKJNp3A9DtfGW",
      accounts: [
        "2eaf27e126551f73a98b7174ef0c38c0750f196a9cefd882a4ffeb3dedc1d61b"
      ],
      chainId: 11155111
    }
  },
  defaultNetwork: "sepolia"
};