const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");

module.exports = async ({deployments}) => {
    const {save} = deployments;
    const params = {name: 'Sion', symbol: 'SION', decimals: 18};
    await deployProxy('Exchange', deployments, save,params);
};

module.exports.tags = ['base', 'Exchange'];
