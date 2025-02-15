const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");
const {BSC} = require("@sion-contracts/common/utils/assets");

let val3EPS = '0x5b5bD8913D766D005859CE002533D4838B0Ebbb5';
let pool = '0x19EC9e3F7B21dd27598E7ad5aAe7dC0Db00A806d';
let lpDepositor = '0x8189F0afdBf8fE6a9e13c69bA35528ac6abeB1af';

module.exports = async ({deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await deploy('AttackStrategyEllipsisDotDotBusd', {
        from: deployer,
        args: [],
        log: true,
    });

    const attackContract = await ethers.getContract("AttackStrategyEllipsisDotDotBusd");

    await (await attackContract.setParams(
        {
            busd: BSC.busd,
            usdc: BSC.usdc,
            usdt: BSC.usdt,
            wBnb: BSC.wBnb,
            val3EPS: val3EPS,
            pool: pool,
            lpDepositor: lpDepositor,
            pancakeRouter: BSC.pancakeRouter,
            wombatRouter: BSC.wombatRouter,
            wombatPool: BSC.wombatPool,
            oracleBusd: BSC.chainlinkBusd,
            oracleUsdc: BSC.chainlinkUsdc,
            oracleUsdt: BSC.chainlinkUsdt,
        }
    )).wait();

    console.log("AttackStrategyEllipsisDotDotBusd deployed");
};

module.exports.tags = ['AttackStrategyEllipsisDotDotBusd'];
