require('hardhat-deploy');
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-waffle");
require('@sion-contracts/common/utils/hardhat-ovn');

const config = require("../common/utils/hardhat-config");

module.exports = {

    namedAccounts: config.namedAccounts,
    networks: config.getNetwork(process.env.ETH_NETWORK),
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    etherscan: config.etherscan(),
    mocha: config.mocha,
    gasReporter: config.gasReport

};
