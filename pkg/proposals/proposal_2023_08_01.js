const { getContract, execTimelock } = require("@sion-contracts/common/utils/script-utils");
const { createProposal, testProposal } = require("@sion-contracts/common/utils/governance");
const {Roles} = require("@sion-contracts/common/utils/roles");

async function main() {

    let addresses = [];
    let values = [];
    let abis = [];


    let PortfolioManager = await getContract('PortfolioManager', 'bsc');
    let StrategyUsdcUsdtPlus = await getContract('StrategyUsdcUsdtPlus', 'bsc');

    addresses.push(PortfolioManager.address);
    values.push(0);
    abis.push(PortfolioManager.interface.encodeFunctionData('addStrategy', [StrategyUsdcUsdtPlus.address]));


    await createProposal(addresses, values, abis);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

