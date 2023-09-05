const {ethers} = require("hardhat");
const {getContract, initWallet,getERC20} = require("@sion-contracts/common/utils/script-utils");
const {COMMON} = require("@sion-contracts/common/utils/assets");
const constants = require('./constants');

async function main() {
    hre.ethers.provider = new ethers.providers.JsonRpcProvider(hre.ethers.provider.connection.url);
    const provider = new ethers.providers.JsonRpcProvider(
        "http://localhost:8545"
      );
    const [owner,deployer] = await ethers.getSigners();
    const fromAddr = constants.whale;
    const toAddr = owner.address;//constants.wallet;

    await provider.send(
        "hardhat_impersonateAccount",
       [fromAddr]
    )
    ethers.parseEther


    const signer = await ethers.getSigner(fromAddr);
  
    let busd = await getERC20("usdc",signer);
    let busdBalance = (await busd.balanceOf(fromAddr)).toString();
    console.log(`Sending funds to ${toAddr}`);
    console.log(`${fromAddr} has ${ethers.utils.formatEther(await signer.getBalance())} ETH`);
    console.log(`${fromAddr} has ${ethers.utils.formatEther(await busd.balanceOf(fromAddr))} USDC`);
    let amount = ethers.utils.parseEther("5.0");
    const tx = {
        to: toAddr,
        value: ethers.utils.parseEther("5")
    }
    await signer.sendTransaction(tx);
    await busd.transfer(
        toAddr,
        busdBalance
    )




};

main();