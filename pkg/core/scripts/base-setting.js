const {getContract, initWallet} = require("@sion-contracts/common/utils/script-utils");
const {Roles} = require("@sion-contracts/common/utils/roles");
const {COMMON} = require("@sion-contracts/common/utils/assets");

// 0x52b1ca27095283a359cc46f1de04f6123e289935 timeclock controller (ovn)
/**
 * Script set up after deploy USD+ to new Chain
 * Add roles PM, UNIT to particular addresses
 */

async function main() {

    let wallet = await initWallet();
    let exchange = await getContract('Exchange','localhost');
    console.log('got exchange');
    let pm = await getContract('PortfolioManager','localhost');
console.log('got pm');
    await (await exchange.grantRole(Roles.PORTFOLIO_AGENT_ROLE, wallet.address)).wait(); // dev
    console.log('granted exchange 1')
   // await (await exchange.grantRole(Roles.PORTFOLIO_AGENT_ROLE, '0x0bE3f37201699F00C21dCba18861ed4F60288E1D')).wait(); // pm
    await (await exchange.grantRole(Roles.PORTFOLIO_AGENT_ROLE, '0xeaf3bc644bda5aec842fc1d3937a533ef67887b6')).wait(); // ovn

    await (await exchange.grantRole(Roles.UNIT_ROLE, wallet.address)).wait(); // dev
    console.log('granted exchange 2')
    //await (await exchange.grantRole(Roles.UNIT_ROLE, '0xb8f55cdd8330b9bf9822137Bc8A6cCB89bc0f055')).wait(); // payout
    //await (await exchange.grantRole(Roles.UNIT_ROLE, '0x5CB01385d3097b6a189d1ac8BA3364D900666445')).wait(); // dev

    await (await exchange.setProfitRecipient(COMMON.rewardWallet)).wait(); // ovn reward wallet
    console.log('granted exchange 3')
    await (await exchange.setPayoutListener(wallet.address)).wait(); // PayoutListener
    console.log('granted exchange 4')

    await (await pm.grantRole(Roles.PORTFOLIO_AGENT_ROLE, wallet.address)).wait(); // dev
    console.log('granted exchange 5')
    //await (await pm.grantRole(Roles.PORTFOLIO_AGENT_ROLE, '0x0bE3f37201699F00C21dCba18861ed4F60288E1D')).wait();       // pm
    await (await pm.grantRole(Roles.PORTFOLIO_AGENT_ROLE, '0xeaf3bc644bda5aec842fc1d3937a533ef67887b6')).wait();       // ovn
    await (await pm.grantRole(Roles.DEFAULT_ADMIN_ROLE, '0xeaf3bc644bda5aec842fc1d3937a533ef67887b6')).wait();       // ovn
    console.log('granted OVN admin');
    // If we plan to deploy DAI+|USDT+ and we will have run the rebalancer bot then grantRole below
    // await (await pm.grantRole(Roles.PORTFOLIO_AGENT_ROLE, "0x6d2aed058bc4b24faa3397c00f2af6bef4849fe6")).wait();  // Rebalance bot

    await (await exchange.setAbroad(1000100, 1000360)).wait();
    await (await exchange.setOracleLoss(100, 100000)).wait();
    await (await exchange.setCompensateLoss(10, 100000)).wait();

    console.log('Base-setting done()');
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

