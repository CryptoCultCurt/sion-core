const {deployProxyMulti} = require("@sion-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");
const {POLYGON} = require("@sion-contracts/common/utils/assets");

let rebaseToken = '0xD7E26D385EC86847944Dff76cd4B19B3BBf910f8';
let hedgeExchanger = '0x5b72258392d31d6B64e16e885758dcf2910895E4';

module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxyMulti(name, 'StrategyEts', deployments, save, null);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(
            {
                asset: POLYGON.usdc,
                rebaseToken: rebaseToken,
                hedgeExchanger: hedgeExchanger,
            }
        )).wait();
    });
};

module.exports.tags = ['StrategyEtsEta'];
