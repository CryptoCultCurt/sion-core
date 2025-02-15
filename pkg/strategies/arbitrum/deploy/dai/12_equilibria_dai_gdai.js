const {deployProxyMulti, deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");
const {ARBITRUM} = require("@sion-contracts/common/utils/assets");


module.exports = async ({getNamedAccounts, deployments}) => {
    const {save, deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await deploySection(async (name) => {
        const rewardLibrary = await deploy("EquilibriaRewardDaiGDaiLibrary", {
            from: deployer
        });

        console.log('RewardLibrary deployed: ' + rewardLibrary.address);

        let params = {
            factoryOptions: {
                libraries: {
                    "EquilibriaRewardDaiGDaiLibrary": rewardLibrary.address,
                }
            },
            unsafeAllow: ["external-library-linking"]
        };

        await deployProxyMulti(name, 'StrategyEquilibriaDaiGDai', deployments, save, params);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(await getParams())).wait();
    });
};


async function getParams() {

    return {
        daiAddress: ARBITRUM.dai,
        ptAddress: '0x1684B747cd46858aE6312A7074353D2101154eF7',
        ytAddress: '0x4a8E64c3A66ce0830e3bf2ea7863b013Aa592114',
        syAddress: '0xAF699fb0D9F12Bf7B14474aE5c9Bea688888DF73',
        lpAddress: '0xa0192f6567f8f5DC38C53323235FD08b318D2dcA',
        pendleRouterAddress: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
        gDaiAddress: '0xd85E038593d7A098614721EaE955EC2022B9B91B',
        pendlePtOracleAddress: '0x428f2f93afAc3F96B0DE59854038c585e06165C8',
        thresholdBalancePercent: 5,
    }

}

module.exports.tags = ['StrategyEquilibriaDaiGDai'];
module.exports.getParams = getParams
module.exports.strategyEquilibriaDaiGDai = getParams
