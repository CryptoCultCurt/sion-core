const {getContract, getPrice} = require("@sion-contracts/common/utils/script-utils");

async function main() {
    let opts = await getPrice();
    const pl = await getContract("ArbitrumPayoutListener", "localhost");
    await (await pl.removeItems(opts)).wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

