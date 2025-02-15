const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {ethers} = require("hardhat");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await deploy('CurveSwapPlace', {
        from: deployer,
        args: [],
        log: true,
    });
};

module.exports.tags = ['base', 'CurveSwapPlace'];
