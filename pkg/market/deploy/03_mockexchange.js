const {ethers} = require("hardhat");

let {POLYGON} = require('@sion-contracts/common/utils/assets');

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const mockSionToken = await ethers.getContract("MockSionToken");

    await deploy('MockExchange', {
        from: deployer,
        args: [mockSionToken.address, POLYGON.usdc],
        log: true,
    });

    console.log("MockExchange created");
};

module.exports.tags = ['test', 'MockExchange'];
