//const {deployContrac} = require("@sion-contracts/common/utils/deployProxy");
const hre = require("hardhat");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

    console.log(hre.network.config.deployer);
    await deploy('SionToken', 
    {
        from: deployer,
        args: [],
        log: true,
    });
};

module.exports.tags = ['base', 'SionToken'];

// const hre = require("hardhat");

// async function main() {

//   const lock = await hre.ethers.deploy("Sion", ["Sion", "SION", 18]);
//   await lock.waitForDeployment();

//   module.exports.tags = ['base','Token'];
   
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });