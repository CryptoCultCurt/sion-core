const {getContract} = require("@sion-contracts/common/utils/script-utils");
const {createProposal, testProposal} = require("@sion-contracts/common/utils/governance");

async function main() {

    let addresses = [];
    let values = [];
    let abis = [];


    let PortfolioManager = await getContract('PortfolioManager', 'arbitrum');
    let StrategyEtsBlackhole = await getContract('StrategyEtsBlackhole', 'arbitrum');

    addresses.push(PortfolioManager.address);
    values.push(0);
    abis.push(PortfolioManager.interface.encodeFunctionData('addStrategy', [StrategyEtsBlackhole.address]));


    await createProposal(addresses, values, abis);
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

