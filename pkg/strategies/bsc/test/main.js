const {BSC} = require('@sion-contracts/common/utils/assets');
const {strategyTest} = require('@sion-contracts/common/utils/strategy-test');
const {getContract, transferETH} = require("@sion-contracts/common/utils/script-utils");
const {impersonatingEtsGrantRole} = require("@sion-contracts/common/utils/tests");
const hre = require('hardhat');
const ethers = hre.ethers;

const HedgeExchanger = require("./abi/ets/HedgeExchanger.json");

async function runStrategyLogic(strategyName, strategyAddress) {

    if (strategyName.indexOf('StrategyEts') !== -1) {
        let hedgeExchangerAddress = "0x65AfD05fbc4413948ffaaD8bCb13f71b6f79332D";
        let ownerAddress = "0x5CB01385d3097b6a189d1ac8BA3364D900666445";
        await impersonatingEtsGrantRole(hedgeExchangerAddress, ownerAddress, strategyAddress);

    } else if (strategyName == 'StrategyUsdPlusUsdt') {
        let exchange = await getContract("Exchange", "bsc");
        await exchange.grantRole(await exchange.FREE_RIDER_ROLE(), strategyAddress);

    } else if (strategyName == 'StrategyUsdcUsdtPlus') {
        let exchange = await getContract("Exchange", "bsc_usdt");
        await exchange.grantRole(await exchange.FREE_RIDER_ROLE(), strategyAddress);
    }
}

describe("BSC", function () {
    let params = {
        name: process.env.TEST_STRATEGY,
        enabledReward: true,
        isRunStrategyLogic: true
    }

    console.log(`Strategy ID ${params.name}`);

    switch (process.env.STAND) {
        case "bsc_usdt":
            strategyTest(params, 'BSC', 'usdt', runStrategyLogic);
            break;
        default:
            strategyTest(params, 'BSC', 'usdc', runStrategyLogic);
            break;
    }
});
