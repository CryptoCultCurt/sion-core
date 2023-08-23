const {ethers} = require("hardhat");
const {getContract, getPrice} = require("@sion-contracts/common/utils/script-utils");
const {createSkim, createSkimTo, createSkimToWithFee, createBribe, createBribeWithFee, createSync, createCustom} = require("@sion-contracts/common/utils/payoutListener");
const {Roles} = require("@sion-contracts/common/utils/roles");
const {COMMON} = require("@sion-contracts/common/utils/assets");

module.exports = async () => {

    let pl = await getContract('PolygonPayoutListener', 'polygon');
    let usdPlus = await getContract('SionToken', 'polygon');

    let price = await getPrice();

    await (await pl.grantRole(Roles.EXCHANGER, (await getContract('Exchange', 'polygon')).address, price)).wait();

    let items = [];
    items.push(...pearl());
    items.push(...sushiSwap());

    await (await pl.addItems(items, price)).wait();

    console.log('PolygonPayoutListener setting done');

    function pearl() {
        let dex = 'Pearl';

        let items = [];
        items.push(createSkim('0xfD0d8283C7808c9CD21220Ff409a016Ace5797be', usdPlus.address, 'USD+/USDR', dex));

        return items;
    }

    function sushiSwap() {
        let dex = 'SushiSwap';

        let items = [];
        items.push(createCustom('0x0319000133d3AdA02600f0875d2cf03D442C3367', usdPlus.address, 'USD+', dex, '0x850a57630A2012B2494779fBc86bBc24F2a7baeF'));

        return items;
    }

};

module.exports.tags = ['SettingPolygonPayoutListener'];

