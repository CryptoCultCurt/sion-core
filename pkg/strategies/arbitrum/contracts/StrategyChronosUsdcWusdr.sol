// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@sion-contracts/core/contracts/Strategy.sol";
import "@sion-contracts/common/contracts/libraries/OvnMath.sol";
import "@sion-contracts/connectors/contracts/stuff/Chronos.sol";
import "@sion-contracts/connectors/contracts/stuff/Chainlink.sol";
import "@sion-contracts/connectors/contracts/stuff/UniswapV3.sol";
import "@sion-contracts/connectors/contracts/stuff/Gmx.sol";
import "hardhat/console.sol";

contract StrategyChronosUsdcWusdr is Strategy {

    uint256 constant public WEEK = 7 * 86400;

    IERC20 public usdc;
    IERC20 public wusdr;
    IERC20 public chr;

    uint256 public usdcDm;
    uint256 public wusdrDm;

    IChronosRouter public router;
    IChronosGauge public gauge;
    IChronosPair public pair;
    IChronosNFT public nft;

    IPriceFeed public oracleUsdc;
    IPriceFeed public oracleWusdr; // no oracle on arbitrum for wUSDR

    IRouter public gmxRouter;
    IVault public gmxVault;
    GmxReader public gmxReader;

    ISwapRouter public uniswapV3Router;


    // Store IDs NFT for each epoch
    // How is it working?
    // LIFO - last in, first out
    uint256[] public tokensEpoch;

    // --- events

    event StrategyUpdatedParams();


    // --- structs

    struct StrategyParams {
        address usdc;
        address wusdr;
        address chr;
        address router;
        address gauge;
        address pair;
        address nft;
        address oracleUsdc;
        address oracleWusdr;
        address uniswapV3Router;
        address gmxRouter;
        address gmxVault;
        address gmxReader;
    }

    // ---  constructor

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() initializer public {
        __Strategy_init();
    }


    // --- Setters

    function setParams(StrategyParams calldata params) external onlyAdmin {
        usdc = IERC20(params.usdc);
        wusdr = IERC20(params.wusdr);
        chr = IERC20(params.chr);

        usdcDm = 10 ** IERC20Metadata(params.usdc).decimals();
        wusdrDm = 10 ** IERC20Metadata(params.wusdr).decimals();

        router = IChronosRouter(params.router);
        gauge = IChronosGauge(params.gauge);
        pair = IChronosPair(params.pair);
        nft = IChronosNFT(params.nft);

        gmxRouter = IRouter(params.gmxRouter);
        gmxVault = IVault(params.gmxVault);
        gmxReader = GmxReader(params.gmxReader);

        oracleUsdc = IPriceFeed(params.oracleUsdc);

        uniswapV3Router = ISwapRouter(params.uniswapV3Router);

        emit StrategyUpdatedParams();
    }


    // --- logic

    function _stake(
        address _asset,
        uint256 _amount
    ) internal override {

        (uint256 reserveWusdr, uint256 reserveUsdc,) = pair.getReserves();
        console.log("reserveWusdr: %s", reserveWusdr);
        console.log("reserveUsdc: %s", reserveUsdc);
       // require(reserveUsdc > 10 ** 3 && reserveWusdr > 10 ** 15, 'Liquidity lpToken reserves too low');

        uint256 usdcBalance = usdc.balanceOf(address(this));
        uint256 wusdrBalance = wusdr.balanceOf(address(this));

        uint256 amountUsdcIn = GmxLibrary.getAmountToSwap(
            gmxVault,
            gmxReader,
            address(usdc),
            address(wusdr),
            usdcBalance,
            reserveUsdc,
            reserveWusdr,
            usdcDm,
            wusdrDm,
            1
        );

        uint256 amountOutMin = OvnMath.subBasisPoints(_oracleUsdcToWusdr(amountUsdcIn), swapSlippageBP);

        _swap(address(usdc), address(wusdr), amountUsdcIn, amountOutMin);

        usdcBalance = usdc.balanceOf(address(this));
        wusdrBalance = wusdr.balanceOf(address(this));

        usdc.approve(address(router), usdcBalance);
        wusdr.approve(address(router), wusdrBalance);

        router.addLiquidity(
            address(usdc),
            address(wusdr),
            true,
            usdcBalance,
            wusdrBalance,
            OvnMath.subBasisPoints(usdcBalance, stakeSlippageBP),
            OvnMath.subBasisPoints(wusdrBalance, stakeSlippageBP),
            address(this),
            block.timestamp
        );

        uint256 pairBalance = pair.balanceOf(address(this));
        _stakeToGauge(pairBalance);
    }

    function _unstake(
        address _asset,
        uint256 _amount,
        address _beneficiary
    ) internal override returns (uint256) {

        uint256 totalLpBalance = pair.totalSupply();
        (uint256 reserveWusdr, uint256 reserveUsdc,) = pair.getReserves();

        uint256 amountLp = GmxLibrary.getAmountLpTokens(
            gmxVault,
            gmxReader,
            address(usdc),
            address(wusdr),
            OvnMath.addBasisPoints(_amount + 10, swapSlippageBP),
            totalLpBalance,
            reserveUsdc,
            reserveWusdr,
            usdcDm,
            wusdrDm,
            1
        );

        uint256 pairBalance = gauge.balanceOf(address(this));

        if (amountLp > pairBalance) {
            amountLp = pairBalance;
        }

        uint256 amountUsdc = reserveUsdc * amountLp / totalLpBalance;
        uint256 amountWusdr = reserveWusdr * amountLp / totalLpBalance;

        _unstakeFromGauge(amountLp);

        pair.approve(address(router), amountLp);
        router.removeLiquidity(
            address(usdc),
            address(wusdr),
            true,
            amountLp,
            OvnMath.subBasisPoints(amountUsdc, stakeSlippageBP),
            OvnMath.subBasisPoints(amountWusdr, stakeSlippageBP),
            address(this),
            block.timestamp
        );

        uint256 wusdrBalance = wusdr.balanceOf(address(this));
        uint256 amountOutMin = OvnMath.subBasisPoints(_oracleWusdrToUsdc(wusdrBalance), swapSlippageBP);
        _swap(address(wusdr), address(usdc), wusdrBalance, amountOutMin);

        return usdc.balanceOf(address(this));
    }

    function _unstakeFull(
        address _asset,
        address _beneficiary
    ) internal override returns (uint256) {

        uint256 pairBalance = gauge.balanceOf(address(this));

        if (pairBalance == 0) {
            return usdc.balanceOf(address(this));
        }

        _unstakeFromGauge(pairBalance);

        uint256 totalLpBalance = pair.totalSupply();
        (uint256 reserveWusdr, uint256 reserveUsdc,) = pair.getReserves();

        uint256 amountUsdc = reserveUsdc * pairBalance / totalLpBalance;
        uint256 amountWusdr = reserveWusdr * pairBalance / totalLpBalance;

        pair.approve(address(router), pairBalance);
        router.removeLiquidity(
            address(usdc),
            address(wusdr),
            true,
            pairBalance,
            OvnMath.subBasisPoints(amountUsdc, stakeSlippageBP),
            OvnMath.subBasisPoints(amountWusdr, stakeSlippageBP),
            address(this),
            block.timestamp
        );

        uint256 wusdrBalance = wusdr.balanceOf(address(this));
        uint256 amountOutMin = OvnMath.subBasisPoints(_oracleWusdrToUsdc(wusdrBalance), swapSlippageBP);
        _swap(address(wusdr), address(usdc), wusdrBalance, amountOutMin);

        return usdc.balanceOf(address(this));
    }


    // How to stake?
    // - if not exist any tokens
    //   then create NFT and add ID to array
    // - if existed token in current epoch
    //   then create NFT and merge with last NFT from current epoch (position in array is last)
    // - if not existed token for current epoch
    //   then create NFT and push to last position

    function _stakeToGauge(uint256 pairBalance) internal {

        pair.approve(address(gauge), pairBalance);

        if(tokensEpoch.length == 0){
            tokensEpoch.push(gauge.deposit(pairBalance));
        }else {
            uint256 currentEpoch = block.timestamp/WEEK;

            uint256 lastToken = tokensEpoch[tokensEpoch.length - 1];
            uint256 lastEpoch = gauge._depositEpoch(lastToken);

            if(lastEpoch == currentEpoch){
                // Current epoch -> merge with last position
                uint256 tokenIdNew = gauge.deposit(pairBalance);
                gauge.harvestAndMerge(tokenIdNew, lastToken);
            }else {
                // New epoch -> push to last position
                uint256 tokenId = gauge.deposit(pairBalance);
                tokensEpoch.push(tokenId);
            }
        }
    }


    function _unstakeFromGauge(uint256 pairBalance) internal {

        if(gauge.balanceOf(address(this)) == pairBalance){
            gauge.withdrawAndHarvestAll();
            delete tokensEpoch;
        }else {
            _unstakeTokensByRecursion(pairBalance);
        }
    }

    // How to unstake?
    // Using recursion for unstaking enought pair amounts
    //
    // Step 0:
    // - targetPairBalance - 100
    // - currentPairBalance - 0
    // - tokensEpoch = [1,2,3]
    // then
    // - Burn token 3
    // - Recursion call

    // Step 1:
    // - targetPairBalance - 100
    // - currentPairBalance - 50
    // - tokensEpoch = [1,2]
    // then
    // - Burn token 2
    // - Recursion call

    // Step 2:
    // - targetPairBalance - 100
    // - currentPairBalance - 150
    // - tokensEpoch = [1]
    // then
    // - stake pair balance to gauge - 50
    // - return 100 pair

    function _unstakeTokensByRecursion(uint256 targetPairBalance) internal {

        uint256 currentPairBalance = pair.balanceOf(address(this));
        if (targetPairBalance > currentPairBalance) {

            uint256 lastToken = tokensEpoch[tokensEpoch.length - 1];
            gauge.withdrawAndHarvest(lastToken);
            tokensEpoch.pop();

            return _unstakeTokensByRecursion(targetPairBalance);
        } else {
            uint256 stakePairBalance = currentPairBalance - targetPairBalance;
            if (stakePairBalance > 0) {
                _stakeToGauge(stakePairBalance);
            }
        }
    }


    function netAssetValue() external view override returns (uint256) {
        return _totalValue(true);
    }

    function liquidationValue() external view override returns (uint256) {
        return _totalValue(false);
    }

    function _totalValue(bool nav) internal view returns (uint256) {
        uint256 usdcBalance = usdc.balanceOf(address(this));
        uint256 wusdrBalance = wusdr.balanceOf(address(this));

        uint256 pairBalance = gauge.balanceOf(address(this));
        if (pairBalance > 0) {
            uint256 totalLpBalance = pair.totalSupply();
            (uint256 reserveWusdr, uint256 reserveUsdc,) = pair.getReserves();
            usdcBalance += reserveUsdc * pairBalance / totalLpBalance;
            wusdrBalance += reserveWusdr * pairBalance / totalLpBalance;
        }

        uint256 usdcBalanceFromWusdr;
        if (wusdrBalance > 0) {
            if (nav) {
                usdcBalanceFromWusdr = _oracleWusdrToUsdc(wusdrBalance);
            } else {
                usdcBalanceFromWusdr = GmxLibrary.getAmountOut(gmxVault, gmxReader, address(wusdr), address(usdc), wusdrBalance);
            }
        }

        return usdcBalance + usdcBalanceFromWusdr;
    }

    function _claimRewards(address _to) internal override returns (uint256) {

        if (gauge.balanceOf(address(this)) == 0) {
            return 0;
        }

        uint256 usdcBefore = usdc.balanceOf(address(this));

        // claim rewards
        gauge.getAllReward();

        // sell rewards
        uint256 chrBalance = chr.balanceOf(address(this));
        if (chrBalance > 0) {
            uint256 amountOut = ChronosLibrary.getAmountsOut(
                router,
                address(chr),
                address(usdc),
                false,
                chrBalance
            );

            if (amountOut > 0) {
                ChronosLibrary.singleSwap(
                    router,
                    address(chr),
                    address(usdc),
                    false,
                    chrBalance,
                    amountOut * 99 / 100,
                    address(this)
                );
            }

        }

        uint256 totalUsdc = usdc.balanceOf(address(this)) - usdcBefore;
        if (totalUsdc > 0) {
            usdc.transfer(_to, totalUsdc);
        }

        return totalUsdc;
    }

    function _oracleWusdrToUsdc(uint256 amount) internal view returns (uint256) {
        uint256 priceUsdc = uint256(oracleUsdc.latestAnswer());
        uint256 priceWusdr = 106500000000000000000;
        return ChainlinkLibrary.convertTokenToToken(amount, wusdrDm, usdcDm, priceWusdr, priceUsdc);
    }

    function _oracleUsdcToWusdr(uint256 amount) internal view returns (uint256) {
        uint256 priceUsdc = uint256(oracleUsdc.latestAnswer());
        uint256 priceWusdr = 106500000000000000000;
        return ChainlinkLibrary.convertTokenToToken(amount, usdcDm, wusdrDm, priceUsdc, priceWusdr);
    }

    function _swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin) internal {

        // Gmx Vault has max limit for accepting tokens, for example wUSDR max capacity: 35kk$
        // If after swap vault of balance more capacity then transaction revert
        // We check capacity and if it not enough then use other swap route (UniswapV3)


        // AmountIn expand to 18 decimal because gmx store all amounts in 18 decimals
        // USDC - 6 decimals => +12 decimals
        // wUSDR - 18 decimals => +0 decimals
        uint256 capacityAfterSwap = gmxVault.usdgAmounts(address(tokenIn));
        capacityAfterSwap += amountIn * (10 ** (18 - IERC20Metadata(tokenIn).decimals()));
        uint256 maxCapacity = gmxVault.maxUsdgAmounts(address(tokenIn));


        if (maxCapacity > capacityAfterSwap) {
            GmxLibrary.singleSwap(
                gmxRouter,
                address(tokenIn),
                address(tokenOut),
                amountIn,
                amountOutMin);

        } else {
            UniswapV3Library.singleSwap(
                uniswapV3Router,
                address(tokenIn),
                address(tokenOut),
                100,
                address(this),
                amountIn,
                amountOutMin
            );
        }
    }

}
