const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {ARBITRUM} = require('@sion-contracts/common/utils/assets');
const {deploySection, settingSection, getContract} = require("@sion-contracts/common/utils/script-utils");


module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {


        let usdPlus = await getContract("SionToken", "arbitrum");
        let exchange = await getContract("Exchange", "arbitrum");

        await (await strategy.setParams(
            {

                usdc: ARBITRUM.usdc,
                dai: ARBITRUM.dai,
                usdPlus: usdPlus.address,
                exchange: exchange.address,
                oracleDai: ARBITRUM.oracleDai,
                oracleUsdc: ARBITRUM.oracleUsdc,
                gmxRouter: ARBITRUM.gmxRouter,
                zyberPool: ARBITRUM.zyber3Pool,
                uniswapV3Router: ARBITRUM.uniswapV3Router,
                poolFee: 500, //0.05%
                gmxVault: ARBITRUM.gmxVault
            }
        )).wait();
    });
};

module.exports.tags = ['StrategyUsdPlusDai'];
