const hre = require("hardhat");
const {getERC20, getDevWallet, transferETH} = require("@sion-contracts/common/utils/script-utils");
const {fromE6} = require("@sion-contracts/common/utils/decimals");
const {ethers} = require("hardhat");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deployer} = await getNamedAccounts();

    await transferETH(10, '0x5CB01385d3097b6a189d1ac8BA3364D900666445');
    let holder = '0x489f866c0698c8d6879f5c0f527bc8281046042d';

    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [holder],
    });

    let wallet = await getDevWallet();

    const tx = {
        from: wallet.address,
        to: holder,
        value: ethers.utils.parseEther('1'),
        nonce: await hre.ethers.provider.getTransactionCount(wallet.address, "latest"),
        gasLimit: 229059,
        gasPrice: await hre.ethers.provider.getGasPrice(),
    }
    await wallet.sendTransaction(tx);

    const signerWithAddress = await hre.ethers.getSigner(holder);
    let usdc = await getERC20("usdc");

    await usdc.connect(signerWithAddress).transfer(deployer, await usdc.balanceOf(signerWithAddress.address));
};

module.exports.tags = ['test'];
