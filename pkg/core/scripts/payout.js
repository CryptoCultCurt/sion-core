const hre = require("hardhat");
const fs = require("fs");
const {getContract, getPrice, execTimelock, showM2M} = require("@overnight-contracts/common/utils/script-utils");

async function main() {

    let exchange = await getContract('Exchange', 'polygon');
    //
    // await execTimelock(async (timelock)=>{
    //
    //     await showM2M();
    //
    //     await (await exchange.connect(timelock).setPayoutTimes(1637193600, 24 * 60 * 60, 15 * 60)).wait();
    //
    //     try {
    //         let tx = await exchange.connect(timelock).payout(await getPrice());
    //         await tx.wait();
    //     } catch (e) {
    //         console.log(e.message);
    //     }
    //
    //     let tx = await exchange.payout(await getPrice());
    //     await tx.wait();
    //
    //     await showM2M();
    // })


    while (true) {
        await showM2M();
        try {
            let tx = await exchange.payout(await getPrice());
            await tx.wait();
            break
        } catch (e) {
            console.log(e.error)
            await sleep(60000);
        }
    }
    await showM2M();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

