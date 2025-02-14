const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {OPTIMISM} = require('@sion-contracts/common/utils/assets');
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");

let poolFee = 500; // 0.05%

module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(
            {
                usdc: OPTIMISM.usdc,
                aUsdc: OPTIMISM.aUsdc,
                op: OPTIMISM.op,
                aaveProvider: OPTIMISM.aaveProvider,
                rewardsController: OPTIMISM.rewardsController,
                uniswapV3Router: OPTIMISM.uniswapV3Router,
                poolFee: poolFee
            }
        )).wait();
    });

};

module.exports.tags = ['StrategyAave'];
