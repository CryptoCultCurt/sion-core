const {ethers} = require("hardhat");

let {ARBITRUM} = require('@sion-contracts/common/utils/assets');

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const mockSionToken = await ethers.getContract("MockSionToken");

    await deploy('MockExchange', {
        from: deployer,
        args: [mockSionToken.address, ARBITRUM.usdc],
        log: true,
    });

    console.log("MockExchange created");
};

module.exports.tags = ['MockExchange'];
