// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@sion-contracts/core/contracts/Strategy.sol";

contract StrategyUsdt is Strategy {

    // --- params

    IERC20 public usdt;

    // --- events

    event StrategyUpdatedParams();


    // --- structs

    struct StrategyParams {
        address usdt;
    }


    // ---  constructor

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() initializer public {
        __Strategy_init();
    }


    // --- Setters

    function setParams(StrategyParams calldata params) external onlyAdmin {
        usdt = IERC20(params.usdt);
    }


    // --- logic

    function _stake(
        address _asset,
        uint256 _amount
    ) internal override {
    }

    function _unstake(
        address _asset,
        uint256 _amount,
        address _beneficiary
    ) internal override returns (uint256) {
        return _amount;
    }

    function _unstakeFull(
        address _asset,
        address _beneficiary
    ) internal override returns (uint256) {
        return usdt.balanceOf(address(this));
    }

    function netAssetValue() external view override returns (uint256) {
        return usdt.balanceOf(address(this));
    }

    function liquidationValue() external view override returns (uint256) {
        return usdt.balanceOf(address(this));
    }


    function _claimRewards(address _beneficiary) internal override returns (uint256) {
        return 0;
    }

}
