const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {save} = deployments;

    await deployProxy('StrategySpookySwapTusdUsdc', deployments, save);
};

module.exports.tags = ['base', 'StrategySpookySwapTusdUsdc'];
