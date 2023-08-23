require('hardhat-deploy');
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
const config = require("@sion-contracts/common/utils/hardhat-config");

module.exports = {

    namedAccounts: config.namedAccounts,
    networks: config.getNetwork('FANTOM'),
    solidity: config.solidity,
    etherscan: config.etherscan(),
    mocha: config.mocha,
    gasReporter: config.gasReport

};
