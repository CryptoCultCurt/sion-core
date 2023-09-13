const {getContract, getPrice, execTimelock, initWallet, convertWeights, showM2M} = require("@sion-contracts/common/utils/script-utils");
const {POLYGON} = require("@sion-contracts/common/utils/assets");
const constants = require('./sion/constants')

async function main() {

    await execTimelock(async (timelock) => {

        let weights = [
            {
                "strategy": "0x204d2E5c581506e939295DaF99079b590ace906e",
                "name": "Stargate USDC",
                "minWeight": 0,
                "targetWeight": 100,
                "riskFactor": 0,
                "maxWeight": 100,
                "enabled": true,
                "enabledReward": true
            },
            // {
            //     "strategy": "0xFed574f62eda014B0C09966D678c06ecbf1AA5df",
            //     "name": "Balancer USDC",
            //     "minWeight": 0,
            //     "targetWeight": 0,
            //     "riskFactor": 0,
            //     "maxWeight": 100,
            //     "enabled": true,
            //     "enabledReward": true
            // }
        ]

        weights = await convertWeights(weights);

        let price = await getPrice();
        console.log('price: ' + price);

       // let pm = await getContract('PortfolioManager');
       const pm = await constants.getContract('PortfolioManager');
        console.log('granting role');
    //   await pm.grantRole(await pm.DEFAULT_ADMIN_ROLE(), '0xf334cc3649c999aa6e0ca85001db97c0aac4a0f4');
     //   await pm.connect(timelock).grantRole(await pm.PORTFOLIO_AGENT_ROLE(), timelock.address);
        console.log("role granted");
//DEFAULT_ADMIN_ROLE
//        let StrategyBalancerUsdc = await getContract('StrategyBalancerUsdc', 'localhost');
//        await StrategyBalancerUsdc.setSlippages(100, 20, 4);
//        console.log("StrategyBalancerUsdc setSlippages done");

       // await showM2M();
       console.log('adding strategy')
      //  await pm.connect(timelock).addStrategy("0x204d2E5c581506e939295DaF99079b590ace906e");
        console.log('strategy added');
      //  await (await pm.connect(timelock).setCashStrategy('0x204d2E5c581506e939295DaF99079b590ace906e')).wait();
        console.log('cash strategy set');
        await pm.connect(timelock).setStrategyWeights(weights);
        console.log("setStrategyWeights done");
     

        await showM2M();

        await pm.balance(price);
        console.log("balance done");

        await showM2M();

    });

}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

