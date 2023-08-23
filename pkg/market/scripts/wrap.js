const { verify } = require("@sion-contracts/common/utils/verify-utils");
const {getContract, getWalletAddress} = require("@sion-contracts/common/utils/script-utils");
const {fromAsset, toAsset} = require("@sion-contracts/common/utils/decimals");

async function main() {

    let market = await getContract('Market');
    let usdPlus = await getContract('SionToken');
    let wUsdPlus = await getContract('WrappedSionToken');

    let address = await getWalletAddress();
    let amount = toAsset(2);


    console.log('USD+:  ' + fromAsset(await usdPlus.balanceOf(address)));
    console.log('wUSD+: ' + fromAsset(await wUsdPlus.balanceOf(address)));

    await (await usdPlus.approve(market.address, amount)).wait();
    console.log('Asset approve done');
    await (await market.wrap(usdPlus.address, amount, address)).wait();
    console.log('market.wrap done');

    console.log('USD+:  ' + fromAsset(await usdPlus.balanceOf(address)));
    console.log('wUSD+: ' + fromAsset(await wUsdPlus.balanceOf(address)));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
