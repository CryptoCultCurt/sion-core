const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");

module.exports = async ({deployments}) => {
    const {save} = deployments;

    let params = {args: ["USD+", "USD+"]}

    await deployProxy('MockSionToken', deployments, save, params);

    console.log("MockSionToken created");
};

module.exports.tags = ['test', 'MockSionToken'];
