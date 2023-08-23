const {getContract, getERC20, getWalletAddress} = require("@sion-contracts/common/utils/script-utils");
const {strategyVelocoreUsdcUsdPlus} = require("../deploy/02_strategy_velocore_usdc_usdp");
const {toE6, fromE6} = require("@sion-contracts/common/utils/decimals");
const {Roles} = require("@sion-contracts/common/utils/roles");

async function main() {

    let strategy = await getContract('StrategyVelocoreUsdcUsdPlus');
    // let pm = await getContract('PortfolioManager');

    // await (await strategy.setPortfolioManager(pm.address)).wait();
    // console.log('setPortfolioManager done()');

    await (await strategy.setSlippages(20, 20, 10000)).wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

