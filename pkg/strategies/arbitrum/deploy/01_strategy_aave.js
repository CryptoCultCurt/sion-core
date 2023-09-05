const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {ARBITRUM} = require('@sion-contracts/common/utils/assets');
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");

module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
        console.log('deploy done');
    });

    await settingSection(async (strategy) => {
        console.log('setting params')
        await (await strategy.setParams(
            {
                usdc: ARBITRUM.usdc,
                aUsdc: ARBITRUM.aUsdc,
                aaveProvider: ARBITRUM.aaveProvider,
            }
        )).wait();
        console.log('settings done');
    });
};

module.exports.tags = ['StrategyAave'];
