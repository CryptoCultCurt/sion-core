const {getContract, getPrice, initWallet} = require("@sion-contracts/common/utils/script-utils");

async function main() {

    let wallet = await initWallet();
    let price = await getPrice();
    let governor = await getContract('OvnGovernor');
    await (await governor.connect(wallet).executeExec('16481554708669359147268889393130771783602343817327249388582849888469329638517', price)).wait();
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

