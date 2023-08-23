const { ethers } = require("hardhat");

let {POLYGON} = require('@sion-contracts/common/utils/assets');

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const market = await ethers.getContract("Market");
    const mockExchange = await ethers.getContract("MockExchange");
    const mockSionToken = await ethers.getContract("MockSionToken");
    const wrappedSionToken = await ethers.getContract("WrappedSionToken");

    await (await market.setTokens(POLYGON.usdc, mockSionToken.address, wrappedSionToken.address)).wait();
    await (await market.setParams(mockExchange.address)).wait();

    console.log("MockMarket settings done");
};

module.exports.tags = ['test_setting', 'SettingMockMarket'];
