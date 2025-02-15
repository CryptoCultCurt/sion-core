const {ZERO_ADDRESS} = require("@openzeppelin/test-helpers/src/constants");
const {COMMON} = require("./assets");
const {ethers} = require("hardhat");

const PayoutListenerABI = require("./abi/PayoutListener.json");
const {Interface} = require("ethers/lib/utils");


const OPERATIONS = {
    SKIM : 0,
    SYNC : 1,
    BRIBE : 2,
    CUSTOM : 3
}



function createSkim(pool, token, poolName, dexName){

    return {
        pool: pool,
        token: token,
        poolName: poolName,
        bribe: ZERO_ADDRESS,
        operation: OPERATIONS.SKIM,
        to: COMMON.rewardWallet,
        dexName: dexName,
        feePercent: 0,
        feeReceiver: ZERO_ADDRESS,
        __gap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
}

function createSync(pool, token, poolName, dexName){

    return {
        pool: pool,
        token: token,
        poolName: poolName,
        bribe: ZERO_ADDRESS,
        operation: OPERATIONS.SYNC,
        to: ZERO_ADDRESS,
        dexName: dexName,
        feePercent: 0,
        feeReceiver: ZERO_ADDRESS,
        __gap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
}


function createCustom(pool, token, poolName, dexName, to = COMMON.rewardWallet) {

    return {
        pool: pool,
        token: token,
        poolName: poolName,
        bribe: ZERO_ADDRESS,
        operation: OPERATIONS.CUSTOM,
        to: to,
        dexName: dexName,
        feePercent: 0,
        feeReceiver: ZERO_ADDRESS,
        __gap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
}


function createSkimTo(pool, token, poolName, dexName, to){

    return {
        pool: pool,
        token: token,
        poolName: poolName,
        bribe: ZERO_ADDRESS,
        operation: OPERATIONS.SKIM,
        to: to,
        dexName: dexName,
        feePercent: 0,
        feeReceiver: ZERO_ADDRESS,
        __gap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
}

function createSkimToWithFee(pool, token, poolName, dexName, to, feePercent, feeReceiver) {

    return {
        pool: pool,
        token: token,
        poolName: poolName,
        bribe: ZERO_ADDRESS,
        operation: OPERATIONS.SKIM,
        to: to,
        dexName: dexName,
        feePercent: feePercent,
        feeReceiver: feeReceiver,
        __gap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
}

function createBribe(pool, token, poolName, dexName, bribe){

    return {
        pool: pool,
        token: token,
        poolName: poolName,
        bribe: bribe,
        operation: OPERATIONS.BRIBE,
        to: COMMON.rewardWallet,
        dexName: dexName,
        feePercent: 0,
        feeReceiver: ZERO_ADDRESS,
        __gap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
}

function createBribeWithFee(pool, token, poolName, dexName, bribe, feePercent = 20, feeReceiver = COMMON.rewardWallet){

    return {
        pool: pool,
        token: token,
        poolName: poolName,
        bribe: bribe,
        operation: OPERATIONS.BRIBE,
        to: COMMON.rewardWallet,
        dexName: dexName,
        feePercent: feePercent,
        feeReceiver: feeReceiver,
        __gap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
}

function showPoolOperations(receipt){

    let pl = new Interface(PayoutListenerABI);

    let items = [];
    receipt.logs.forEach((value, index) => {
        try {
            let result = pl.parseLog(value);

            if (result.name === 'PoolOperation'){

                items.push({
                    dex: result.args[0],
                    operation: result.args[1],
                    poolName: result.args[2],
                    pool: result.args[3],
                    token: result.args[4],
                    amount: result.args[5].toString(),
                    to: result.args[6],
                    feeAmount: result.args[7].toString(),
                    feeReceiver: result.args[8]
                })

            }
        } catch (e) {
        }
    });

    console.log(items);
}


module.exports = {
    PayoutListenerOperations: OPERATIONS,
    createSkim: createSkim,
    createSync: createSync,
    createSkimTo: createSkimTo,
    createSkimToWithFee: createSkimToWithFee,
    createBribe: createBribe,
    createBribeWithFee: createBribeWithFee,
    createCustom: createCustom,
    showPoolOperations: showPoolOperations,
};
