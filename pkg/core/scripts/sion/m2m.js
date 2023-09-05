const {getContract, initWallet} = require("@sion-contracts/common/utils/script-utils");
const {Roles} = require("@sion-contracts/common/utils/roles");
const {COMMON} = require("@sion-contracts/common/utils/assets");
const constants = require("./constants");


async function main() {
    let ethers = hre.ethers;
    let wallet = await initWallet();
    const [owner] = await ethers.getSigners();
    const { chainId } = await ethers.provider.getNetwork();
    console.log(`\nOwner:       ${owner.address}`);
  //  console.log(`Deployer:    ${deployer.address}`);
    console.log(`Block:       ${await ethers.provider.getBlockNumber()}`);
    console.log(`Chain:       ${chainId}`);

    //const m2m = await constants.getContract('Mark2Market');
   // let m2m = await getContract('Mark2Market','localhost');
    const m2m = await constants.getContract('Mark2Market');

    const pm = await m2m.portfolioManager();

    //const totalLiquidationAssets = await m2m.totalLiquidationAssets();
  //  const totalNetAssets = await m2m.totalNetAssets();
  const totalLiquidationAssets = 0;
  const totalNetAssets = 0;
    console.log(`M2MSettings:
    pm:                         ${pm}
    totalLiquidationAssets:     ${constants.toDec18(totalLiquidationAssets)}
    totalNetAssets:             ${constants.toDec18(totalNetAssets)}

    `)

    let weights = await m2m.strategyAssets();
    let i=0;
    for (const weight of weights) {
        const strategy = await constants.getContractAt("StrategyWombexUsdt",weight.strategy);
        let strategyName = "Unknown";
        try {
            strategyName = await strategy.name();
            console.log(await strategy.name());
        } catch (e) {
            console.log('failed to get name');
            console.log(e);
        }

        console.log(`Strategy#${i}:
        Strategy                ${strategyName}  
        Address:                ${weight.strategy}
        netAssetValue:          ${constants.toDec18(weight.netAssetValue).toString()}
        liquidationValue:       ${constants.toDec18(weight.liquidationValue).toString()}
        `)

        console.log('\n')
        i++;
    }
}

main()