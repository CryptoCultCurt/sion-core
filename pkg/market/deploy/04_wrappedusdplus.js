const {deployProxy} = require("@sion-contracts/common/utils/deployProxy");
const {getContract} = require("@sion-contracts/common/utils/script-utils");
const hre = require("hardhat");
const {ethers} = require("hardhat");

module.exports = async ({deployments}) => {
    const {save} = deployments;

    const SionToken = await getContract("SionToken");

    let params;

    if (hre.network.name === "optimism_dai") {
        params = {args: [SionToken.address, "Wrapped DAI+", "wDAI+", 18]};
    } else if (hre.network.name === "arbitrum_dai") {
        params = {args: [SionToken.address, "Wrapped DAI+", "wDAI+", 18]};
    } else if (hre.network.name === "bsc_usdt") {
        params = {args: [SionToken.address, "Wrapped USDT+", "wUSDT+", 18]};
    } else {
        params = {args: [SionToken.address, "Wrapped USD+", "wUSD+", 6]};
    }

    await deployProxy('WrappedSionToken', deployments, save, params);

    console.log("WrappedSionToken created");

    let wrappedSionToken = await ethers.getContract('WrappedSionToken');

    console.log('WrappedSionToken deploy done()');
    console.log('Symbol:   ' + await wrappedSionToken.symbol());
    console.log('Name:     ' + await wrappedSionToken.name());
    console.log('Decimals: ' + await wrappedSionToken.decimals());
};

module.exports.tags = ['base', 'WrappedSionToken'];
