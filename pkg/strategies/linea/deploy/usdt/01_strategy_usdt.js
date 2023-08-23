const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");
const {LINEA} = require("@sion-contracts/common/utils/assets");


module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(await getParams())).wait();
    });
};

async function getParams(){

    return {
        usdt: LINEA.usdt,
    }

}

module.exports.tags = ['StrategyUsdt'];
module.exports.strategyUsdt = getParams
