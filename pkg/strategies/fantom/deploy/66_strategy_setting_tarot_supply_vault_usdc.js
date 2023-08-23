const {ethers} = require("hardhat");

let {FANTOM} = require('@sion-contracts/common/utils/assets');
let {core} = require('@sion-contracts/common/utils/core');

module.exports = async () => {
    const strategy = await ethers.getContract("StrategyTarotSupplyVaultUsdc");

    await (await strategy.setTokens(FANTOM.usdc, FANTOM.tUsdc, FANTOM.bTarotSpirit)).wait();
    await (await strategy.setParams(FANTOM.tarotSupplyVaultRouter)).wait();
    await (await strategy.setPortfolioManager(core.pm)).wait();

    console.log('StrategyTarotSupplyVaultUsdc setting done');
};

module.exports.tags = ['setting', 'StrategyTarotSupplyVaultUsdcSetting'];
