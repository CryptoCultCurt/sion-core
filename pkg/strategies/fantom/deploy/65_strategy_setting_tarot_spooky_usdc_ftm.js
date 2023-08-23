const {ethers} = require("hardhat");

let {FANTOM} = require('@sion-contracts/common/utils/assets');
let {core} = require('@sion-contracts/common/utils/core');

module.exports = async () => {
    const strategy = await ethers.getContract("StrategyTarotSpookyUsdcFtm");

    await (await strategy.setTokens(FANTOM.usdc, FANTOM.bTarotSpooky)).wait();
    await (await strategy.setParams(FANTOM.tarotRouter)).wait();
    await (await strategy.setPortfolioManager(core.pm)).wait();

    console.log('StrategyTarotSpookyUsdcFtm setting done');
};

module.exports.tags = ['setting', 'StrategyTarotSpookyUsdcFtmSetting'];
