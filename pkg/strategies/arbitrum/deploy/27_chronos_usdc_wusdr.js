const {deployProxyMulti, deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");
const {ARBITRUM} = require("@sion-contracts/common/utils/assets");


module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(await getParams())).wait();
    });
};


async function getParams() {

    return {
        usdc: ARBITRUM.usdc,
        wusdr: ARBITRUM.wusdr,
        chr: ARBITRUM.chr,
        router: ARBITRUM.chronosRouter,
        gauge: '0xf78e178D089ED3EF3f297Aac0bEcF9d57f931227',
        pair: '0x9DeBDCcA77DDF6f89A048bD8E1DD6270B82fe8e1', // USDC/DAI
        nft: '0x9774ae804e6662385f5ab9b01417bc2c6e548468', // MaNFTs
        oracleUsdc: ARBITRUM.oracleUsdc,
        uniswapV3Router: ARBITRUM.uniswapV3Router,
        gmxVault: ARBITRUM.gmxVault,
        gmxReader: ARBITRUM.gmxReader,
        gmxRouter: ARBITRUM.gmxRouter,
    }
}

module.exports.tags = ['StrategyChronosUsdcWusdr'];
module.exports.getParams = getParams
module.exports.strategyChronosUsdcDaiParams = getParams
