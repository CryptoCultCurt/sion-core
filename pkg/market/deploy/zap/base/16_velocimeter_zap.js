const { deployProxy } = require("@sion-contracts/common/utils/deployProxy");
const { BASE } = require("@sion-contracts/common/utils/assets");
const { ethers } = require("hardhat");
const { Roles } = require("@sion-contracts/common/utils/roles");

module.exports = async ({ deployments }) => {
    const { save } = deployments;

    await deployProxy('VelocimeterZap', deployments, save);
    console.log("VelocimeterZap deploy done()");

    let params = {
        odosRouter: BASE.odosRouter,
        velocimeterRouter: BASE.velocimeterRouter
    }

    let zap = await ethers.getContract('VelocimeterZap');
    await (await zap.grantRole(Roles.DEFAULT_ADMIN_ROLE, '0x5CB01385d3097b6a189d1ac8BA3364D900666445')).wait();

    await (await zap.setParams(params)).wait();
    console.log('VelocimeterZap setParams done()');
};

module.exports.tags = ['VelocimeterZap'];
