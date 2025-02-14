const {strategyTest} = require('@sion-contracts/common/utils/strategy-test');
const {impersonatingEtsGrantRole, impersonatingStaker} = require("@sion-contracts/common/utils/tests");

async function runStrategyLogic(strategyName, strategyAddress) {


    if (strategyName.indexOf('StrategyEts') !== -1) {
        let hedgeExchangerAddress = "0x181AAb77E68CD6803f60cbAE88674dE20101bf3f";
        let ownerAddress = "0x5CB01385d3097b6a189d1ac8BA3364D900666445";
        await impersonatingEtsGrantRole(hedgeExchangerAddress, ownerAddress, strategyAddress);
    }
}

describe("LINEA", function () {
    let params = {
        name: process.env.TEST_STRATEGY,
        enabledReward: true,
        isRunStrategyLogic: true
    }

    console.log(`Strategy ID ${params.name}`);

    switch (process.env.STAND) {
        case 'linea_usdt':
            strategyTest(params, 'LINEA', 'usdt', runStrategyLogic);
            break;
        default:
            strategyTest(params, 'LINEA', 'usdc', runStrategyLogic);
            break;
    }
});
