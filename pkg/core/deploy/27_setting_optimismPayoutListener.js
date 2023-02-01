const {ethers} = require("hardhat");
const {COMMON} = require("@overnight-contracts/common/utils/assets");


module.exports = async ({getNamedAccounts, deployments}) => {

    const pl = await ethers.getContract("OptimismPayoutListener");
    const exchange = await ethers.getContract("Exchange");
    const usdPlus = await ethers.getContract("UsdPlusToken");

    await (await pl.setExchanger(exchange.address)).wait();
    await (await pl.setTokens(usdPlus.address)).wait();
    await (await pl.setCollector(COMMON.rewardWallet)).wait();


    let velodromePools = [
        '0x8a9Cd3dce710e90177B4332C108E159a15736A0F', // sAMM-USD+/LUSD
        '0xDf4bB088B1F02881AD4497b6FA7C1E4F81B61C0a', // sAMM-USD+/WETH/USDC
        '0x98dc12979a34ee2f7099b1cbd65f9080c5a3284f', // vAMM-wstETH/USD+
    ];

    let velodromeBribes = [
        '0x41a7540ec8cb3afafe16a834abe0863f22016ec0', // sAMM-USD+/LUSD
        '0x35F4Ea9Fa8a081C8Fad8033cb93877bc621c8Ee0', // sAMM-USD+/WETH/USDC
        '0xAd6d543C3015fF9833aC057312e4562b791334b2', // vAMM-wstETH/USD+
    ];

    await (await pl.setVelodromePools(velodromePools, velodromeBribes)).wait();


    let velodromePoolsCollector = [
        '0x67124355cce2ad7a8ea283e990612ebe12730175', // sAMM-USD+/USDC
        '0xf2438edf9d5db2dbc6866ef01c9eb7ca1ca8ad13', // vAMM-USD+/USDC
        '0xa99817d2d286C894F8f3888096A5616d06F20d46', // sAMM-USD+/DOLA
    ];

    await (await pl.setVelodromePoolsCollector(velodromePoolsCollector)).wait();


    console.log('OptimismPayoutListener done');

};

module.exports.tags = [ 'SettingOptimismPayoutListener'];

