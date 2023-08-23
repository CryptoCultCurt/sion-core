const {getContract} = require("@sion-contracts/common/utils/script-utils");
const { ethers } = require("hardhat");

module.exports = async ({getNamedAccounts, deployments}) => {

    const market = await ethers.getContract("Market");
    const exchange = await getContract("Exchange");
    const SionToken = await getContract("SionToken");
    const wrappedSionToken = await ethers.getContract("WrappedSionToken");

    let asset = await exchange.usdc();
    await (await market.setTokens(asset, SionToken.address, wrappedSionToken.address)).wait();
    await (await market.setParams(exchange.address)).wait();

    console.log("Market settings done");
};

module.exports.tags = ['setting', 'SettingMarket'];
