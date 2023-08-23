const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");

module.exports = async ({deployments}) => {
    const {save} = deployments;

    let params = {args: ["USD+", "USD+", 6]}

    await deployProxy('MockSionToken', deployments, save, params);

    console.log("MockSionToken created");
};

module.exports.tags = ['MockSionToken'];
