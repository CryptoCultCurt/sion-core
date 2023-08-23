const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {ARBITRUM} = require('@sion-contracts/common/utils/assets');
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");

module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(
            {
                dai: ARBITRUM.dai,
                aDai: ARBITRUM.aDai,
                aaveProvider: ARBITRUM.aaveProvider,
            }
        )).wait();
    });
};

module.exports.tags = ['StrategyAaveDai'];
