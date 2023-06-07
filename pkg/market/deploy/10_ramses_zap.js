const { deployProxy } = require("@overnight-contracts/common/utils/deployProxy");
const { ARBITRUM } = require("@overnight-contracts/common/utils/assets");
const { ethers } = require("hardhat");

module.exports = async ({ deployments }) => {
    const { save } = deployments;

    await deployProxy('RamsesZap', deployments, save);
    console.log("RamsesZap deploy done()");

    let params = {
        odosRouter: ARBITRUM.odosRouter,
        ramsesRouter: ARBITRUM.ramsesRouter
    }

    let zap = await ethers.getContract('RamsesZap');

    await (await zap.setParams(params)).wait();
    console.log('RamsesZap setParams done()');
};

module.exports.tags = ['RamsesZap'];
