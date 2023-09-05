const { ethers } = require("hardhat");
const {getContract, initWallet} = require("@sion-contracts/common/utils/script-utils");
const {Wallet} = require("zksync-web3");

const hre = require('hardhat');
module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const wallet = await initWallet();
    console.log('wallet.address: ' + wallet.address);
    const usdPlus = await ethers.getContract("SionToken", wallet);
    const exchange = await ethers.getContract("Exchange", wallet);

    console.log('usdPlus.setExchanger: ' + exchange.address)
    let tx = await usdPlus.setExchanger(exchange.address);
    await tx.wait();
    console.log("usdPlus.setExchanger done");
};

module.exports.tags = ['setting','SettingSionToken'];
