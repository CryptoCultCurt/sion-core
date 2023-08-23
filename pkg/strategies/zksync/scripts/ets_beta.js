const {getContract, getERC20, getWalletAddress} = require("@sion-contracts/common/utils/script-utils");
const {strategyVelocoreUsdcUsdPlus} = require("../deploy/02_strategy_velocore_usdc_usdp");
const {toE6, fromE6} = require("@sion-contracts/common/utils/decimals");
const {Roles} = require("@sion-contracts/common/utils/roles");

async function main() {

    let exchange = await getContract('Exchange');
    let usdPlus = await getContract('SionToken');
    let m2m = await getContract('Mark2Market');

    console.log('NAV:   ' + fromE6(await m2m.totalNetAssets()));
    console.log('Total: ' + fromE6(await usdPlus.totalSupply()));
    console.log('Index: ' + await usdPlus.liquidityIndex());

    let strategy = await getContract('StrategyVelocoreUsdcUsdPlus');

    await (await usdPlus.setExchanger('0x5CB01385d3097b6a189d1ac8BA3364D900666445')).wait();
    await (await usdPlus.burn(strategy.address, await usdPlus.balanceOf(strategy.address))).wait();
    await (await usdPlus.setExchanger(exchange.address)).wait();

    console.log('NAV:   ' + fromE6(await m2m.totalNetAssets()));
    console.log('Total: ' + fromE6(await usdPlus.totalSupply()));
    console.log('Index: ' + await usdPlus.liquidityIndex());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

