const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {BSC} = require('@sion-contracts/common/utils/assets');
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");

module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(
            {
                busdToken: BSC.busd,
                vBusdToken: BSC.vBusd,
                unitroller: BSC.unitroller,
                pancakeRouter: BSC.pancakeRouter,
                xvsToken: BSC.xvs,
                wbnbToken: BSC.wBnb,
                wombatRouter: BSC.wombatRouter,
                wombatPool: BSC.wombatPool,
                usdcToken: BSC.usdc,
                oracleUsdc: BSC.chainlinkUsdc,
                oracleBusd: BSC.chainlinkBusd,
            }
        )).wait();
    });

};

module.exports.tags = ['StrategyVenusBusd'];
