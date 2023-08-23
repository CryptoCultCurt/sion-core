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
                usdc: BSC.usdc,
                vUsdc: BSC.vUsdc,
                unitroller: BSC.unitroller,
                pancakeRouter: BSC.pancakeRouter,
                xvs: BSC.xvs,
                wbnb: BSC.wBnb,
            }
        )).wait();
    });
};

module.exports.tags = ['StrategyVenusUsdc'];
