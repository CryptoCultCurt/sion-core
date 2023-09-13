const {getContract, getPrice, showM2M} = require("@sion-contracts/common/utils/script-utils");
const {createProposal, testProposal} = require("@sion-contracts/common/utils/governance");

async function main() {

    let pm = await getContract('PortfolioManager');

    let addresses = [];
    let values = [];
    let abis = [];

    addresses.push(pm.address);
    values.push(0);
    abis.push(pm.interface.encodeFunctionData('addStrategy', ['0x204d2E5c581506e939295DaF99079b590ace906e']));

    // addresses.push(pm.address);
    // values.push(0);
    // abis.push(pm.interface.encodeFunctionData('addStrategy', ['0xAB4F5f1Ee46Af26A9201c2C28af9C570727c582d']));

    // await showM2M();
    // await testProposal(addresses, values, abis);
    // await showM2M();
    await createProposal(addresses, values, abis);
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

