const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");

module.exports = async ({deployments}) => {
    const {save} = deployments;
    await deployProxy('BscPayoutListener', deployments, save);
};

module.exports.tags = ['BscPayoutListener'];
