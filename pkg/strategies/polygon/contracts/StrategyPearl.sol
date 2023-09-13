// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@sion-contracts/core/contracts/Strategy.sol";
import "@sion-contracts/connectors/contracts/stuff/UniswapV2.sol";
import "@sion-contracts/connectors/contracts/stuff/Stargate.sol";
import "@sion-contracts/common/contracts/libraries/OvnMath.sol";

// USDR 0x40379a439D4F6795B6fc9aa5687dB461677A2dBa
// USDC 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
// USDR/USDC Pool 0x40379a439D4F6795B6fc9aa5687dB461677A2dBa
// Pearl Router 0xcc25c0fd84737f44a7d38649b69491bbf0c7f083 call swapExactTokensForTokens "params:[qty,qtyMin,[[routeFrom,routeTo,stable]],wallet,timeout"
// Pearl Reward Contract 0x51fae5d7dac720d1db988f10e531941f2c75a4fa call getReward() to claim rewards
// Caviar Mint Contract 0xe1efd5c259c6fea2536e41e084314838ddea881f call deposit(amount) to mint pearl into caviar
    // example: https://polygonscan.com/tx/0x9b1526af99e53e52936b978482598bb4ae95c7f0fe0a4019855b09d0f7b9fc52
// Caviar Stake Contract 0x83c5022745b2511bd199687a42d27befd025a9a9 call deposit(amount,wallet) to stake caviar
    // example: https://polygonscan.com/tx/0x8ff28f8bd7c5e0a9b4f6601e6e4af9075f32cf06b5897d985a4ebdd2ff6ff86c
// 0x6ae96cc93331c19148541d4d2f31363684917092 -- need to approve
// Caviar Stake Contract 0x83c5022745b2511bd199687a42d27befd025a9a9 call withdraw(amount,wallet) to unstake caviar
// Caviar Stake Contract 0x83c5022745b2511bd199687a42d27befd025a9a9 call harvest(wallet) to claim rewards
    // example: https://polygonscan.com/tx/0x9e7df3b6c476c37796f5c0faf768f9f96e87cdeeeb7b05726484e274f484a3fe
// After claiming rewards send the the caviar to the treasury wallet

// claim referral fee of caviar contract: 0xC38E3A10B5818601b29c83F195E8b5854AAE45aF
// Caviar referral contract 0xa9fB5713067a161C0212A9cEa31f1736ce917ab3

// use Pearl router on polygon to swap usdc to USDR in the pool 0x40379a439D4F6795B6fc9aa5687dB461677A2dBa



contract StrategyStargateUsdc is Strategy, UniswapV2Exchange {
    using OvnMath for uint256;

    IERC20 public usdcToken;
    IERC20 public stgToken;

    IStargateRouter public stargateRouter;
    IStargatePool public pool;
    ILPStaking public lpStaking;
    uint256 public pid;

    uint256 public usdcTokenDenominator;


    // --- events

    event StrategyUpdatedTokens(address usdcToken, address stgToken, uint256 usdcTokenDenominator);

    event StrategyUpdatedParams(address stargateRouter, address pool, address lpStaking, uint256 pid, address sushiSwapRouter);


    // ---  constructor

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() initializer public {
        __Strategy_init();
    }


    // --- Setters

    function setTokens(
        address _usdcToken,
        address _stgToken
    ) external onlyAdmin {

        require(_usdcToken != address(0), "Zero address not allowed");
        require(_stgToken != address(0), "Zero address not allowed");

        usdcToken = IERC20(_usdcToken);
        stgToken = IERC20(_stgToken);

        usdcTokenDenominator = 10 ** IERC20Metadata(_usdcToken).decimals();

        emit StrategyUpdatedTokens(_usdcToken, _stgToken, usdcTokenDenominator);
    }

    function setParams(
        address _stargateRouter,
        address _pool,
        address _lpStaking,
        uint256 _pid,
        address _sushiSwapRouter
    ) external onlyAdmin {

        require(_stargateRouter != address(0), "Zero address not allowed");
        require(_pool != address(0), "Zero address not allowed");
        require(_lpStaking != address(0), "Zero address not allowed");
        require(_sushiSwapRouter != address(0), "Zero address not allowed");

        stargateRouter = IStargateRouter(_stargateRouter);
        pool = IStargatePool(_pool);
        lpStaking = ILPStaking(_lpStaking);
        pid = _pid;
        _setUniswapRouter(_sushiSwapRouter);

        emit StrategyUpdatedParams(_stargateRouter, _pool, _lpStaking, _pid, _sushiSwapRouter);
    }


    // --- logic

    function _stake(
        address _asset,
        uint256 _amount
    ) internal override {

        require(_asset == address(usdcToken), "Some token not compatible");

        // add liquidity
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        usdcToken.approve(address(stargateRouter), usdcBalance);
        stargateRouter.addLiquidity(uint16(pool.poolId()), usdcBalance, address(this));

        // stake
        uint256 lpBalance = pool.balanceOf(address(this));
        pool.approve(address(lpStaking), lpBalance);
        lpStaking.deposit(pid, lpBalance);
    }

    function _unstake(
        address _asset,
        uint256 _amount,
        address _beneficiary
    ) internal override returns (uint256) {

        require(_asset == address(usdcToken), "Some token not compatible");

        // unstake
        uint256 usdcAmount = _amount + 10;
        uint256 lpBalance = usdcAmount * usdcTokenDenominator / pool.amountLPtoLD(usdcTokenDenominator);
        (uint256 amount,) = lpStaking.userInfo(pid, address(this));
        if (lpBalance > amount) {
            lpBalance = amount;
        }
        lpStaking.withdraw(pid, lpBalance);

        // remove liquidity
        pool.approve(address(stargateRouter), lpBalance);
        stargateRouter.instantRedeemLocal(uint16(pool.poolId()), lpBalance, address(this));

        return usdcToken.balanceOf(address(this));
    }

    function _unstakeFull(
        address _asset,
        address _beneficiary
    ) internal override returns (uint256) {

        require(_asset == address(usdcToken), "Some token not compatible");

        // unstake
        (uint256 amount,) = lpStaking.userInfo(pid, address(this));
        if (amount == 0) {
            return usdcToken.balanceOf(address(this));
        }
        lpStaking.withdraw(pid, amount);

        // remove liquidity
        pool.approve(address(stargateRouter), amount);
        stargateRouter.instantRedeemLocal(uint16(pool.poolId()), amount, address(this));

        return usdcToken.balanceOf(address(this));
    }

    function netAssetValue() external view override returns (uint256) {
        return _totalValue();
    }

    function liquidationValue() external view override returns (uint256) {
        return _totalValue();
    }

    function _totalValue() internal view returns (uint256) {
        uint256 usdcBalance = usdcToken.balanceOf(address(this));

        (uint256 amount,) = lpStaking.userInfo(pid, address(this));
        if (amount > 0) {
            usdcBalance += pool.amountLPtoLD(amount);
        }

        return usdcBalance;
    }

    function _claimRewards(address _to) internal override returns (uint256) {

        // claim rewards
        (uint256 amount,) = lpStaking.userInfo(pid, address(this));
        if (amount == 0) {
            return 0;
        }
        lpStaking.withdraw(pid, 0);

        // sell rewards
        uint256 totalUsdc;

        uint256 stgBalance = stgToken.balanceOf(address(this));
        if (stgBalance > 0) {
            uint256 stgUsdc = _swapExactTokensForTokens(
                address(stgToken),
                address(usdcToken),
                stgBalance,
                address(this)
            );
            totalUsdc += stgUsdc;
        }

        if (totalUsdc > 0) {
            usdcToken.transfer(_to, totalUsdc);
        }

        return totalUsdc;
    }

}
