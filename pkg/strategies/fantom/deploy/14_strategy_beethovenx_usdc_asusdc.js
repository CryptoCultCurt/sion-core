const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {save} = deployments;

    await deployProxy('StrategyBeethovenxUsdcAsUsdc', deployments, save);
};

module.exports.tags = ['base', 'StrategyBeethovenxUsdcAsUsdc'];
