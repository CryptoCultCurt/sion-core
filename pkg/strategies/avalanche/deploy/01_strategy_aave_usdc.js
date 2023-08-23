const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");
const {AVALANCHE} = require("@sion-contracts/common/utils/assets");

module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {

        await (await strategy.setTokens(AVALANCHE.usdc, AVALANCHE.aUsdc)).wait();
        await (await strategy.setParams(AVALANCHE.aaveProvider)).wait();
    });
};

module.exports.tags = ['StrategyAave'];
