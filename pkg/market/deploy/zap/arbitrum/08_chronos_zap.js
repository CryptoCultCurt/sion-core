const { deployProxy } = require("@sion-contracts/common/utils/deployProxy");
const { ARBITRUM } = require("@sion-contracts/common/utils/assets");
const { ethers } = require("hardhat");
const { Roles } = require("@sion-contracts/common/utils/roles");

module.exports = async ({ deployments }) => {
    const { save } = deployments;

    await deployProxy('ChronosZap', deployments, save);
    console.log("ChronosZap deploy done()");


    let params = {
        odosRouter: ARBITRUM.odosRouter,
        chronosRouter: ARBITRUM.chronosRouter
    }

    let zap = await ethers.getContract('ChronosZap');
    await (await zap.grantRole(Roles.DEFAULT_ADMIN_ROLE, '0x5CB01385d3097b6a189d1ac8BA3364D900666445')).wait();

    await (await zap.setParams(params)).wait();
    console.log('ChronosZap setParams done()');
};

module.exports.tags = ['ChronosZap'];
