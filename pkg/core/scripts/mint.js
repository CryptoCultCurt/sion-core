const {toAsset} = require("@sion-contracts/common/utils/decimals");

const {getContract, showM2M, getCoreAsset, transferETH, initWallet, getWalletAddress} = require("@sion-contracts/common/utils/script-utils");


async function main() {

    let exchange = await getContract('Exchange');
    let asset = await getCoreAsset();

    await showM2M();

    await (await asset.approve(exchange.address, toAsset(2000))).wait();
    console.log('Asset approve done');
    console.log('asset.address: ' + asset.address);

    // await (await exchange.buy(asset.address, toAsset(2))).wait();
    // console.log('Exchange.buy done');

    await showM2M();
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

