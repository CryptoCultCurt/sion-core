const { ARBITRUM } = require("@sion-contracts/common/utils/assets");
const {ethers} = require("hardhat");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const mockSionToken = await ethers.getContract("MockSionToken");

    let pendleSionTokenSY = await deploy("PendleSionTokenSY", {
        from: deployer,
        args: ['Pendle USD+', 'USD+SY', mockSionToken.address],
        log: true,
        skipIfAlreadyDeployed: false
    });

    console.log("PendleSionTokenSY created at " + pendleSionTokenSY.address);
};

module.exports.tags = ['PendleSionTokenSY'];
