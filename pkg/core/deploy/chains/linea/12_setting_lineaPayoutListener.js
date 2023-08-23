const {ethers} = require("hardhat");
const {getContract, getPrice} = require("@sion-contracts/common/utils/script-utils");
const {createSkim, createSkimTo, createSkimToWithFee, createBribe, createBribeWithFee, createSync} = require("@sion-contracts/common/utils/payoutListener");
const {Roles} = require("@sion-contracts/common/utils/roles");
const {COMMON} = require("@sion-contracts/common/utils/assets");


module.exports = async () => {

    const pl = await getContract("LineaPayoutListener", 'linea');
    const usdPlus = await getContract('SionToken', 'linea');
    const usdtPlus = await getContract('SionToken', 'linea_usdt');

    let items = [];

    // await (await pl.addItems(items)).wait();
   await (await pl.grantRole(Roles.EXCHANGER, (await getContract('Exchange', 'linea')).address)).wait();
   // await (await pl.grantRole(Roles.EXCHANGER, (await getContract('Exchange', 'linea_usdt')).address)).wait();

    console.log('LineaPayoutListener setting done');



};

module.exports.tags = ['SettingLineaPayoutListener'];

