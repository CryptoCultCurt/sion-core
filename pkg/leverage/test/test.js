const {sharedBeforeEach} = require("@sion-contracts/common/utils/sharedBeforeEach");
const BigNumber = require("bignumber.js");
const {expect} = require("chai");
const {greatLess} = require("@sion-contracts/common/utils/tests");
const hre = require("hardhat");
const {deployments, ethers, getNamedAccounts} = require('hardhat');
const {getERC20} = require("@sion-contracts/common/utils/script-utils");
const {toE6, fromE6} = require("@sion-contracts/common/utils/decimals");


describe(`LeverageSonneStrategy`, function () {


    let strategy;
    let asset;
    let toAsset;
    let fromAsset;

    sharedBeforeEach(`LeverageSonneStrategy`, async () => {

        await hre.run("compile");
        await deployments.fixture(['LeverageSonneStrategy', 'test']);

        const signers = await ethers.getSigners();
        const account = signers[0];
        const recipient = signers[1];


        asset = await getERC20('usdc', account);
        toAsset = toE6;
        fromAsset = fromE6;
        strategy = await ethers.getContract('LeverageSonneStrategy');
    });



    it(`deposit`, async function () {

        await asset.transfer(strategy.address, toAsset(10));
        await strategy.deposit();
    });



});
