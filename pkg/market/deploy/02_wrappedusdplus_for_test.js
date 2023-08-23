const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {ethers} = require("hardhat");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {save} = deployments;

    const mockSionToken = await ethers.getContract("MockSionToken");

    let params = { args: [mockSionToken.address, 'Wrapped MockUSD+', 'wMockUSD+', 6] };

    await deployProxy('WrappedSionToken', deployments, save, params);

    console.log("WrappedSionTokenForTest created");
};

module.exports.tags = ['test', 'WrappedSionTokenForTest'];
