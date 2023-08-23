const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {OPTIMISM} = require('@sion-contracts/common/utils/assets');
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");

let poolOpUsdcFee = 500; // 0.05%
let poolUsdcDaiFee = 100; // 0.01%

module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(
            {
                dai: OPTIMISM.dai,
                usdc: OPTIMISM.usdc,
                aDai: OPTIMISM.aDai,
                op: OPTIMISM.op,
                aaveProvider: OPTIMISM.aaveProvider,
                rewardsController: OPTIMISM.rewardsController,
                uniswapV3Router: OPTIMISM.uniswapV3Router,
                poolOpUsdcFee: poolOpUsdcFee,
                poolUsdcDaiFee: poolUsdcDaiFee
            }
        )).wait();
    });

};

module.exports.tags = ['StrategyAaveDai'];
