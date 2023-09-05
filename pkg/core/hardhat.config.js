require('hardhat-deploy');
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');
require('@sion-contracts/common/utils/hardhat-ovn');
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-verify");
require('dotenv').config();

const config = require("../common/utils/hardhat-config");

module.exports = {

    namedAccounts: {
        deployer: {
            default: 0
        }
    },
    networks: config.getNetwork(process.env.ETH_NETWORK),
    accounts: {mnemonic: process.env.MNEMONIC},
    solidity: config.solidity,
    zksolc: config.zksolc,
    etherscan: config.etherscan(),
    mocha: config.mocha,
    gasReporter: config.gasReport

};
