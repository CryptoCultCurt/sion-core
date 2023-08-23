const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");
const {POLYGON} = require("@sion-contracts/common/utils/assets");

module.exports = async ({deployments}) => {
    const {save} = deployments;


    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {

        await (await strategy.setTokens(POLYGON.usdc, POLYGON.amUsdc)).wait();
        await (await strategy.setParams(POLYGON.aaveProvider)).wait();
    });
};

module.exports.tags = ['StrategyAave'];
