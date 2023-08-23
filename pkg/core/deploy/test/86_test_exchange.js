const {ethers} = require("hardhat");
const {deployProxy, deployProxyMulti} = require("@sion-contracts/common/utils/deployProxy");
const {COMMON} = require("@sion-contracts/common/utils/assets");


module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();
    const {save} = deployments;

    await deployProxy('Exchange', deployments, save);
    await deployProxy('SionToken', deployments, save, {args: ["USD+", "USD+", 0]});

    await deployProxyMulti('AssetToken', 'SionToken', deployments, save, {args: ["MockBUSD", "MockBUSD", 0]});

    await deploy('MockPortfolioManager', {
        from: deployer,
        args: [],
        log: true,
    });

    await deploy('MockInsuranceExchange', {
        from: deployer,
        args: [],
        log: true,
    });


    let usdPlus = await ethers.getContract('SionToken');
    let asset = await ethers.getContract('AssetToken');
    let insurance = await ethers.getContract('MockInsuranceExchange');
    let pm = await ethers.getContract('MockPortfolioManager');
    let exchange = await ethers.getContract('Exchange');


    await usdPlus.setExchanger(exchange.address);
    await asset.setExchanger(deployer);

    await exchange.setTokens(usdPlus.address, asset.address);
    await exchange.setPortfolioManager(pm.address);
    await exchange.setMark2Market(pm.address);
    await exchange.setInsurance(insurance.address);

    await pm.setAsset(asset.address);
    await insurance.setAsset(asset.address);

    await exchange.grantRole(await exchange.PORTFOLIO_AGENT_ROLE(), deployer);

    await exchange.setBuyFee(0, 100000);
    await exchange.setRedeemFee(0, 100000);
};

module.exports.tags = ['TestExchange'];

