const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");

module.exports = async ({deployments}) => {
    const {save} = deployments;
    await deployProxy('ArbitrumPayoutListener', deployments, save);
};

module.exports.tags = ['ArbitrumPayoutListener'];
