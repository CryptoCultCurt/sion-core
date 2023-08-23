const {deployProxyMulti, deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");
const {ARBITRUM} = require("@sion-contracts/common/utils/assets");

module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(await getParams())).wait();
    });
};

async function getParams() {
    return {
        dai: ARBITRUM.dai,
    }
}

module.exports.tags = ['StrategyFractalDai'];
module.exports.getParams = getParams;
module.exports.strategyFractalDaiParams = getParams;
