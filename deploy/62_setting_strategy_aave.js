const { ethers } = require("hardhat");

const fs = require("fs");
let assets = JSON.parse(fs.readFileSync('./assets.json'));

let aaveAddress = "0xd05e3E715d945B59290df0ae8eF85c1BdB684744";


module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const strategy = await ethers.getContract("StrategyAave");
    await (await strategy.setParams(aaveAddress, assets.usdc, assets.amUsdc )).wait();
    console.log('StrategyAave setting done');

};

module.exports.tags = ['setting','StrategyAaveSetting'];

