// const { fromE18, toE18, fromAsset, fromE6, toAsset } = require("./decimals");
const { toE6, fromE6, fromE18, toAsset, toE18, fromAsset } = require("@sion-contracts/common/utils/decimals");

const { expect } = require("chai");
const { execTimelock, showM2M, getContract, initWallet, getPrice, impersonateAccount, getWalletAddress, getCoreAsset, convertWeights } = require("@sion-contracts/common/utils/script-utils");
const hre = require('hardhat');
const { getTestAssets, createRandomWallet } = require("@sion-contracts/common/utils/tests");



async function main() {

    const strategy = await getContract('StrategyPendleUsdcUsdt', 'arbitrum');

    // let pendleDaiUsdt = await getContract('StrategyPendleDaiUsdt', 'arbitrum_dai');
    let testWallet = await createRandomWallet();
    let asset = await getCoreAsset();

    await execTimelock(async (timelock) => {

        console.log('Test strategy: ' + strategy.address);

        let operations = [];

        await strategy.connect(timelock).setPortfolioManager(timelock.address);
        let amount = toAsset(300_000);

        await strategy.connect(timelock).unstake(asset.address, amount, testWallet.address, false);

        console.log('Test unstake done: ' + strategy.address);
    });

}

main()