const {deployProxy} = require("@overnight-contracts/common/utils/deployProxy");
const {deploySection, settingSection} = require("@overnight-contracts/common/utils/script-utils");
const {BSC} = require("@overnight-contracts/common/utils/assets");

let coneToken = '0xA60205802E1B5C6EC1CAFA3cAcd49dFeECe05AC9';
let unkwnToken = '0xD7FbBf5CB43b4A902A8c994D94e821f3149441c7';
let coneRouter = '0xbf1fc29668e5f5Eaa819948599c9Ac1B1E03E75F';
let conePair = '0xF9D8A57c4F0bE3BDc6857Ee568F6B23FF9c4d1c6';
let unkwnUserProxy = '0xAED5a268dEE37677584af58CCC2b9e3c83Ab7dd8';
let unkwnLens = '0x5b1cEB9adcec674552CB26dD55a5E5846712394C';
let synapseStableSwapPool = '0x28ec0B36F0819ecB5005cAB836F4ED5a2eCa4D13';
let rewardWalletPercent = 50;

module.exports = async ({deployments}) => {
    const {save} = deployments;

    await deploySection(async (name) => {
        await deployProxy(name, deployments, save);
    });

    await settingSection(async (strategy) => {
        await (await strategy.setParams(
            {
                busdToken: BSC.busd,
                usdcToken: BSC.usdc,
                wBnbToken: BSC.wBnb,
                coneToken: coneToken,
                unkwnToken: unkwnToken,
                coneRouter: coneRouter,
                conePair: conePair,
                unkwnUserProxy: unkwnUserProxy,
                unkwnLens: unkwnLens,
                synapseStableSwapPool: synapseStableSwapPool,
                chainlinkBusd: BSC.chainlinkBusd,
                chainlinkUsdc: BSC.chainlinkUsdc,
                rewardWallet: BSC.rewardWallet,
                rewardWalletPercent: rewardWalletPercent,
            }
        )).wait();
    });
};

module.exports.tags = ['StrategyUnknownBusdUsdc'];
