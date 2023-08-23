const { ethers } = require("hardhat");

module.exports = async ({getNamedAccounts, deployments}) => {
    const mockSionToken = await ethers.getContract("MockSionToken");
    const mockExchange = await ethers.getContract("MockExchange");
    mockSionToken.setExchanger(mockExchange.address);

    console.log("MockExchange settings done");
};

module.exports.tags = ['test_setting', 'SettingMockExchange'];
