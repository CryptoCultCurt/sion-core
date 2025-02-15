const {deployProxy, deployProxyMulti} = require("@sion-contracts/common/utils/deployProxy");
const {ethers, deployments, getNamedAccounts} = require("hardhat");

module.exports = async ({deployments, getNamedAccounts}) => {
    const {deployer} = await getNamedAccounts();
    const {deploy, save} = deployments;

    await deployProxy('MockGlobalPayoutListener', deployments, save);

     await deploy("MockPool", {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false
    });

    await deploy("MockERC20", {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false
    });

    await deploy("MockBribe", {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false
    });

};

module.exports.tags = ['MockGlobalPayoutListener'];
