//const {deployProxy} = require("@sion-contracts/common/utils/deploy");
const hre = require("hardhat");
const {ethers} = require("hardhat"); 


module.exports = async ({getNamedAccounts, deployments}) => {
    console.log(getNamedAccounts);
    const {save} = deployments;

    let params;
    const deployer = await getNamedAccounts();
    params = {args: ["SION", "SION", 18]}
0
    await deploy('SionToken', {
        from: deployer,
        args: ["SION", "SION", 18],
        log: true,
    });

    let sion = await ethers.getContract('SionToken');

    console.log('SionToken deploy done()');
    console.log('Symbol:   ' + await sion.symbol());
    console.log('Name:     ' + await sion.name());
    console.log('Decimals: ' + await sion.decimals());

};

module.exports.tags = ['base', 'SionToken'];
