const {deployProxyMulti} = require("@sion-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@sion-contracts/common/utils/script-utils");
const {POLYGON} = require("@sion-contracts/common/utils/assets");

let rebaseToken = '0x0526Ee5DAc4F85D960CB9539cc78eE77B7fcD719';
let hedgeExchanger = '0x4279474D4643269613ff1832ff9aD88077b4E67F';

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

module.exports.tags = ['StrategyEtsDelta'];
