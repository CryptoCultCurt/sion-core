// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@sion-contracts/core/contracts/Strategy.sol";
import "@sion-contracts/connectors/contracts/stuff/Cone.sol";
import "@sion-contracts/connectors/contracts/stuff/Synapse.sol";
import "@sion-contracts/connectors/contracts/stuff/Chainlink.sol";
import "@sion-contracts/common/contracts/libraries/OvnMath.sol";


contract StrategyConeBusdUsdc is Strategy {

    // --- structs

    struct StrategyParams {
        address busdToken;
        address usdcToken;
        address wBnbToken;
        address coneToken;
        address coneRouter;
        address conePair;
        address coneGauge;
        address synapseStableSwapPool;
        address chainlinkBusd;
        address chainlinkUsdc;
        address rewardWallet;
        uint256 rewardWalletPercent;
    }

    // --- params

    IERC20 public busdToken;
    IERC20 public usdcToken;
    IERC20 public wBnbToken;
    IERC20 public coneToken;

    IConeRouter01 public coneRouter;
    IConePair public conePair;
    IGauge public coneGauge;
    ISwap public synapseStableSwapPool;

    IPriceFeed public chainlinkBusd;
    IPriceFeed public chainlinkUsdc;

    address public rewardWallet;
    uint256 public rewardWalletPercent;

    uint256 public busdTokenDenominator;
    uint256 public usdcTokenDenominator;

    // --- events

    event StrategyUpdatedParams();

    // --- constructor

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() initializer public {
        __Strategy_init();
    }

    // --- setters

    function setParams(StrategyParams calldata params) external onlyAdmin {

        busdToken = IERC20(params.busdToken);
        usdcToken = IERC20(params.usdcToken);
        wBnbToken = IERC20(params.wBnbToken);
        coneToken = IERC20(params.coneToken);

        coneRouter = IConeRouter01(params.coneRouter);
        conePair = IConePair(params.conePair);
        coneGauge = IGauge(params.coneGauge);
        synapseStableSwapPool = ISwap(params.synapseStableSwapPool);

        chainlinkBusd = IPriceFeed(params.chainlinkBusd);
        chainlinkUsdc = IPriceFeed(params.chainlinkUsdc);

        rewardWallet = params.rewardWallet;
        rewardWalletPercent = params.rewardWalletPercent;

        busdTokenDenominator = 10 ** IERC20Metadata(params.busdToken).decimals();
        usdcTokenDenominator = 10 ** IERC20Metadata(params.usdcToken).decimals();

        emit StrategyUpdatedParams();
    }

    // --- logic

    function _stake(
        address _asset,
        uint256 _amount
    ) internal override {

        require(_asset == address(busdToken), "Some token not compatible");

        (uint256 reserveUsdc, uint256 reserveBusd,) = conePair.getReserves();
        require(reserveUsdc > 10 ** 15 && reserveBusd > 10 ** 15, 'Liquidity lpToken reserves too low');

        uint256 busdBalance = busdToken.balanceOf(address(this));
        uint256 amountBusdToSwap = SynapseLibrary.getAmount0(
            synapseStableSwapPool,
            address(busdToken),
            address(usdcToken),
            busdBalance,
            reserveBusd,
            reserveUsdc,
            busdTokenDenominator,
            usdcTokenDenominator,
            1
        );

        // swap busd to usdc
        SynapseLibrary.swap(
            synapseStableSwapPool,
            address(busdToken),
            address(usdcToken),
            amountBusdToSwap
        );

        // add liquidity
        busdBalance = busdToken.balanceOf(address(this));
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        busdToken.approve(address(coneRouter), busdBalance);
        usdcToken.approve(address(coneRouter), usdcBalance);
        coneRouter.addLiquidity(
            address(busdToken),
            address(usdcToken),
            true,
            busdBalance,
            usdcBalance,
            busdBalance * 99 / 100,
            usdcBalance * 99 / 100,
            address(this),
            block.timestamp
        );

        // stake to gauge
        uint256 lpTokenBalance = conePair.balanceOf(address(this));
        conePair.approve(address(coneGauge), lpTokenBalance);
        // don't lock cone -> tokenId = 0
        coneGauge.depositAll(0);
    }

    function _unstake(
        address _asset,
        uint256 _amount,
        address _beneficiary
    ) internal override returns (uint256) {

        require(_asset == address(busdToken), "Some token not compatible");

        (uint256 reserveUsdc, uint256 reserveBusd,) = conePair.getReserves();
        require(reserveUsdc > 10 ** 15 && reserveBusd > 10 ** 15, 'Liquidity lpToken reserves too low');

        // Fetch amount of LP currently staked
        uint256 lpTokenBalance = coneGauge.balanceOf(address(this));
        if (lpTokenBalance > 0) {
            // count amount to unstake
            uint256 totalLpBalance = conePair.totalSupply();
            uint256 lpTokensToWithdraw = SynapseLibrary.getAmountLpTokens(
                synapseStableSwapPool,
                address(busdToken),
                address(usdcToken),
                // add 4bp and 1e14 to _amount for smooth withdraw
                OvnMath.addBasisPoints(_amount, 4) + 1e14,
                totalLpBalance,
                reserveBusd,
                reserveUsdc,
                busdTokenDenominator,
                usdcTokenDenominator,
                1
            );

            if (lpTokensToWithdraw > lpTokenBalance) {
                lpTokensToWithdraw = lpTokenBalance;
            }

            // unstake from gauge
            coneGauge.withdraw(lpTokensToWithdraw);

            uint256 unstakedLPTokenBalance = conePair.balanceOf(address(this));
            uint256 amountOutBusdMin = reserveBusd * unstakedLPTokenBalance / totalLpBalance;
            uint256 amountOutUsdcMin = reserveUsdc * unstakedLPTokenBalance / totalLpBalance;

            // remove liquidity
            conePair.approve(address(coneRouter), unstakedLPTokenBalance);
            coneRouter.removeLiquidity(
                address(busdToken),
                address(usdcToken),
                true,
                unstakedLPTokenBalance,
                amountOutBusdMin * 99 / 100,
                amountOutUsdcMin * 99 / 100,
                address(this),
                block.timestamp
            );
        }

        // swap usdc to busd
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        SynapseLibrary.swap(
            synapseStableSwapPool,
            address(usdcToken),
            address(busdToken),
            usdcBalance
        );

        return busdToken.balanceOf(address(this));
    }

    function _unstakeFull(
        address _asset,
        address _beneficiary
    ) internal override returns (uint256) {

        require(_asset == address(busdToken), "Some token not compatible");

        (uint256 reserveUsdc, uint256 reserveBusd,) = conePair.getReserves();
        require(reserveUsdc > 10 ** 15 && reserveBusd > 10 ** 15, 'Liquidity lpToken reserves too low');

        // Fetch amount of LP currently staked
        uint256 lpTokenBalance = coneGauge.balanceOf(address(this));
        if (lpTokenBalance == 0) {
            return 0;
        }

        // unstake from gauge
        coneGauge.withdrawAll();

        uint256 unstakedLPTokenBalance = conePair.balanceOf(address(this));
        if (unstakedLPTokenBalance > 0) {
            uint256 totalLpBalance = conePair.totalSupply();
            uint256 amountOutBusdMin = reserveBusd * unstakedLPTokenBalance / totalLpBalance;
            uint256 amountOutUsdcMin = reserveUsdc * unstakedLPTokenBalance / totalLpBalance;

            // remove liquidity
            conePair.approve(address(coneRouter), unstakedLPTokenBalance);
            coneRouter.removeLiquidity(
                address(busdToken),
                address(usdcToken),
                true,
                unstakedLPTokenBalance,
                amountOutBusdMin * 99 / 100,
                amountOutUsdcMin * 99 / 100,
                address(this),
                block.timestamp
            );
        }

        // swap usdc to busd
        uint256 usdcBalance = usdcToken.balanceOf(address(this));
        SynapseLibrary.swap(
            synapseStableSwapPool,
            address(usdcToken),
            address(busdToken),
            usdcBalance
        );

        return busdToken.balanceOf(address(this));
    }

    function netAssetValue() external view override returns (uint256) {
        return _totalValue(true);
    }

    function liquidationValue() external view override returns (uint256) {
        return _totalValue(false);
    }

    function _totalValue(bool nav) internal view returns (uint256) {
        uint256 busdBalance = busdToken.balanceOf(address(this));
        uint256 usdcBalance = usdcToken.balanceOf(address(this));

        // Fetch amount of LP currently staked
        uint256 lpTokenBalance = coneGauge.balanceOf(address(this));
        if (lpTokenBalance > 0) {
            uint256 totalLpBalance = conePair.totalSupply();
            (uint256 reserveUsdc, uint256 reserveBusd,) = conePair.getReserves();
            busdBalance += reserveBusd * lpTokenBalance / totalLpBalance;
            usdcBalance += reserveUsdc * lpTokenBalance / totalLpBalance;
        }

        uint256 busdBalanceFromUsdc;
        if (usdcBalance > 0) {
            if (nav) {
                uint256 priceBusd = uint256(chainlinkBusd.latestAnswer());
                uint256 priceUsdc = uint256(chainlinkUsdc.latestAnswer());
                busdBalanceFromUsdc = (usdcBalance * busdTokenDenominator * priceUsdc) / (usdcTokenDenominator * priceBusd);
            } else {
                busdBalanceFromUsdc = SynapseLibrary.calculateSwap(
                    synapseStableSwapPool,
                    address(usdcToken),
                    address(busdToken),
                    usdcBalance
                );
            }
        }

        return busdBalance + busdBalanceFromUsdc;
    }

    function _claimRewards(address _to) internal override returns (uint256) {

        // claim rewards
        uint256 lpTokenBalance = coneGauge.balanceOf(address(this));
        if (lpTokenBalance == 0) {
            return 0;
        }
        address[] memory tokens = new address[](1);
        tokens[0] = address(coneToken);
        coneGauge.getReward(address(this), tokens);

        // sell rewards
        uint256 totalBusd;

        uint256 coneBalance = coneToken.balanceOf(address(this));
        if (coneBalance > 0) {
            uint256 amountOutMin = ConeLibrary.getAmountsOut(
                coneRouter,
                address(coneToken),
                address(wBnbToken),
                address(busdToken),
                false,
                false,
                coneBalance
            );

            if (amountOutMin > 0) {
                uint256 coneBusd = ConeLibrary.swap(
                    coneRouter,
                    address(coneToken),
                    address(wBnbToken),
                    address(busdToken),
                    false,
                    false,
                    coneBalance,
                    amountOutMin * 99 / 100,
                    address(this)
                );

                totalBusd += coneBusd;
            }
        }

        if (totalBusd > 0) {
            uint256 rewardBalance = totalBusd * rewardWalletPercent / 1e4;
            uint256 toBalance = totalBusd - rewardBalance;
            busdToken.transfer(rewardWallet, rewardBalance);
            busdToken.transfer(_to, toBalance);
        }

        return totalBusd;
    }


}
