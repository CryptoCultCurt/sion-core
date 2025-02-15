// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@sion-contracts/core/contracts/Strategy.sol";
import "@sion-contracts/core/contracts/interfaces/IStaker.sol";
import "@sion-contracts/connectors/contracts/stuff/Chainlink.sol";
import "@sion-contracts/connectors/contracts/stuff/KyberSwap.sol";
import "@sion-contracts/connectors/contracts/stuff/UniswapV3.sol";

import "hardhat/console.sol";

contract StrategyKyberSwapUsdcDai is Strategy {


    // --- params

    IERC20 public dai;
    IERC20 public usdc;

    IPriceFeed public oracleUsdc;
    IPriceFeed public oracleDai;

    uint256 public usdcDm;
    uint256 public daiDm;

    ISwapRouter public uniswapV3Router;

    AntiSnipAttackPositionManager public npm;
    Pool public pool;
    uint24 fee;
    uint256 tokenId;
    uint256 poolId;

    int24 lowerTick;
    int24 upperTick;

    KyberSwapElasticLM public lm;

    // --- events

    event StrategyUpdatedParams();


    // --- structs

    struct StrategyParams {
        address usdc;
        address dai;
        address oracleUsdc;
        address oracleDai;
        address uniswapV3Router;
        address pool;
        address npm;
        address lm;
        uint24 fee;
        uint256 poolId;
        int24 lowerTick;
        int24 upperTick;

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
        dai = IERC20(params.dai);

        oracleUsdc = IPriceFeed(params.oracleUsdc);
        oracleDai = IPriceFeed(params.oracleDai);

        uniswapV3Router = ISwapRouter(params.uniswapV3Router);

        usdcDm = 10 ** IERC20Metadata(params.usdc).decimals();
        daiDm = 10 ** IERC20Metadata(params.dai).decimals();

        pool = Pool(params.pool);
        npm = AntiSnipAttackPositionManager(params.npm);
        lm = KyberSwapElasticLM(params.lm);
        poolId = params.poolId;

        lowerTick = params.lowerTick;
        upperTick = params.upperTick;

        fee = params.fee;

        usdc.approve(params.npm, type(uint256).max);
        dai.approve(params.npm, type(uint256).max);

        npm.setApprovalForAll(params.lm, true);

        emit StrategyUpdatedParams();
    }

    // --- logic

    function _stake(
        address _asset,
        uint256 _amount
    ) internal override {

        _swapUsdcToDai();

        uint256 usdcAmount = usdc.balanceOf(address(this));
        uint256 daiAmount = dai.balanceOf(address(this));

        int24[2] memory ticksPrevious;
        (ticksPrevious[0], ticksPrevious[1]) = getPreviousTicks(lowerTick, upperTick);

        if (tokenId == 0) {

            MintParams memory params = MintParams({
                token0 : address(dai),
                token1 : address(usdc),
                fee : fee,
                tickLower : lowerTick,
                tickUpper : upperTick,
                ticksPrevious : ticksPrevious,
                amount0Desired : daiAmount,
                amount1Desired : usdcAmount,
                amount0Min : 0,
                amount1Min : 0,
                recipient : address(this),
                deadline : block.timestamp
            });


            (tokenId,,,) = npm.mint(params);
        } else {

            _exitAndWithdrawNFT();

            IncreaseLiquidityParams memory params = IncreaseLiquidityParams({
                tokenId : tokenId,
                ticksPrevious : ticksPrevious,
                amount0Desired : daiAmount,
                amount1Desired : usdcAmount,
                amount0Min : 0,
                amount1Min : 0,
                deadline : block.timestamp
            });

            npm.addLiquidity(params);
        }

        _depositAndJoinNFT();

    }

    function _unstake(
        address _asset,
        uint256 _amount,
        address _beneficiary
    ) internal override returns (uint256) {

        _amount = OvnMath.addBasisPoints(_amount, swapSlippageBP);

        uint256 amountDai = _calcUsdcAmountToSwap(_amount) * 1e12;
        uint256 amountUsdc = _amount - (amountDai / 1e12);

        _exitAndWithdrawNFT();

        (uint160 sqrtP, , ,) = pool.getPoolState();

        uint128 liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtP,
            TickMath.getSqrtRatioAtTick(lowerTick),
            TickMath.getSqrtRatioAtTick(upperTick),
            amountDai,
            amountUsdc
        );

        _removeLiquidity(liquidity);
        _swapAllDaiToUsdc();

        return usdc.balanceOf(address(this));
    }

    function _unstakeFull(
        address _asset,
        address _beneficiary
    ) internal override returns (uint256) {

        if(tokenId > 0){

            uint256 liquidity = getLiquidity();

            (Position memory pos, ) = npm.positions(tokenId);

            if (pos.rTokenOwed > 0) {
                uint256[] memory nftIds = new uint256[](1);
                nftIds[0] = tokenId;
                lm.claimFee(nftIds, 0, 0, address(pool), false, block.timestamp);
            }

            _exitAndWithdrawNFT();
            _removeLiquidity(liquidity);

            tokenId = 0;

            _swapAllDaiToUsdc();
        }



        return usdc.balanceOf(address(this));
    }


    function netAssetValue() external view override returns (uint256) {
        return _totalValue(true);
    }

    function liquidationValue() external view override returns (uint256) {
        return _totalValue(false);
    }

    function _totalValue(bool nav) internal view returns (uint256) {
        uint256 usdcBalance = usdc.balanceOf(address(this));
        uint256 daiBalance = dai.balanceOf(address(this));

        if (tokenId > 0) {

            uint128 liquidity = getLiquidity();
            if (liquidity > 0) {
                uint160 sqrtRatioX96 = getCurrentSqrtRatio();
                uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(lowerTick);
                uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(upperTick);
                (uint256 daiAmount, uint256 usdcAmount) = LiquidityAmounts.getAmountsForLiquidity(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, liquidity);

                usdcBalance += usdcAmount;
                daiBalance += daiAmount;
            }
        }

        if (daiBalance > 0) {
            if (nav) {
                usdcBalance += _oracleDaiToUsdc(daiBalance);
            } else {
                usdcBalance += OvnMath.subBasisPoints(_oracleDaiToUsdc(daiBalance), swapSlippageBP);
            }
        }


        return usdcBalance;
    }

    function _claimRewards(address _to) internal override returns (uint256) {


        if(tokenId == 0 || !isJoined()){
            return 0;
        }

        uint256[] memory nftIds = new uint256[](1);
        nftIds[0] = tokenId;

        uint256[] memory pIds = new uint256[](1);
        pIds[0] = poolId;

        bytes[] memory datas = new bytes[](1);
        datas[0] = abi.encode(IKyberSwapElasticLM.HarvestData(pIds));
        lm.harvestMultiplePools(nftIds, datas);

        IERC20 knc = IERC20(0xe4DDDfe67E7164b0FE14E218d80dC4C08eDC01cB);
        IERC20 arb = IERC20(0x912CE59144191C1204E64559FE8253a0e49E6548);
        IERC20 wstETH = IERC20(0x5979D7b546E38E414F7E9822514be443A4800529);
        IERC20 weth = IERC20(0x82aF49447D8a07e3bd95BD0d56f35241523fBab1);

        uint256 totalUsdc;

        uint256 kncBalance = knc.balanceOf(address(this));
        uint256 arbBalance = arb.balanceOf(address(this));

        if (kncBalance > 0) {

            IRouter kyberRouter = IRouter(0xF9c2b5746c946EF883ab2660BbbB1f10A5bdeAb4);

            KyberswapLibrary.singleSwap(
                kyberRouter,
                address(knc),
                address(wstETH),
                1000,
                address(this),
                kncBalance,
                0
            );

            uint256 wstETHBalance = wstETH.balanceOf(address(this));

            totalUsdc += UniswapV3Library.multiSwap(
                uniswapV3Router,
                address(wstETH),
                address(weth),
                address(usdc),
                100,
                500,
                address(this),
                wstETHBalance,
                0
            );

        }

        if(arbBalance > 0){

            totalUsdc += UniswapV3Library.singleSwap(
                uniswapV3Router,
                address(arb),
                address(usdc),
                100, // 0.01%
                address(this),
                arbBalance,
                0
            );
        }

        if (totalUsdc > 0) {
            usdc.transfer(_to, totalUsdc);
        }

        return totalUsdc;
    }



    function _swapAllDaiToUsdc() internal {

        uint256 daiBalance = dai.balanceOf(address(this));

        UniswapV3Library.singleSwap(
            uniswapV3Router,
            address(dai),
            address(usdc),
            100, // 0.01%
            address(this),
            daiBalance,
            OvnMath.subBasisPoints(_oracleDaiToUsdc(daiBalance), swapSlippageBP)
        );
    }

    function _removeLiquidity(uint256 liquidity) internal {

        RemoveLiquidityParams memory params = RemoveLiquidityParams({
            tokenId : tokenId,
            liquidity : uint128(liquidity),
            amount0Min : 0,
            amount1Min : 0,
            deadline : block.timestamp
        });

        npm.removeLiquidity(params);
        npm.transferAllTokens(address(usdc), 0, address(this));
        npm.transferAllTokens(address(dai), 0, address(this));
    }

    function _depositAndJoinNFT() internal {
        uint256[] memory nftIds = new uint256[](1);
        nftIds[0] = tokenId;

        uint256[] memory liqs = new uint256[](1);
        liqs[0] = getLiquidity();

        lm.deposit(nftIds);
        lm.join(poolId, nftIds, liqs);
    }

    function _exitAndWithdrawNFT() internal {

        uint256[] memory nftIds = new uint256[](1);
        nftIds[0] = tokenId;

        if(isJoined()){
            uint256[] memory liqs = new uint256[](1);
            (liqs[0],,) = lm.getUserInfo(tokenId, poolId);
            lm.exit(poolId, nftIds, liqs);
        }

        lm.withdraw(nftIds);
    }

    function isJoined() internal returns(bool){
        uint256[] memory pools = lm.getJoinedPools(tokenId);
        return pools.length > 0;
    }

    function getCurrentSqrtRatio() public view returns (uint160 sqrtRatioX96) {
        (sqrtRatioX96,,,) = pool.getPoolState();
    }

    function getLiquidity() public view returns (uint128 liquidity) {
        if (tokenId > 0) {
            (Position memory pos,) = npm.positions(tokenId);
            liquidity = pos.liquidity;
        }
    }

    function _swapUsdcToDai() internal {

        uint256 daiBalance = dai.balanceOf(address(this));
        uint256 usdcBalance = usdc.balanceOf(address(this));
        usdcBalance = OvnMath.addBasisPoints(usdcBalance, swapSlippageBP);

        uint256 needDai = _calcUsdcAmountToSwap(usdcBalance - (daiBalance / 1e12));

        if(needDai > 0 ){
            UniswapV3Library.singleSwap(
                uniswapV3Router,
                address(usdc),
                address(dai),
                100, // 0.01%
                address(this),
                needDai,
                OvnMath.subBasisPoints(_oracleUsdcToDai(needDai), swapSlippageBP)
            );
        }

    }

    function _calcUsdcAmountToSwap(uint256 _amount) internal returns (uint256){

        (uint160 sqrtP, , ,) = pool.getPoolState();
        (uint128 baseL,,) = pool.getLiquidityState();

        (uint256 amountDai, uint256 amountUsdc) = LiquidityAmounts.getAmountsForLiquidity(
            sqrtP,
            TickMath.getSqrtRatioAtTick(lowerTick),
            TickMath.getSqrtRatioAtTick(upperTick),
            baseL);


        uint256 needUsdcValue = (_amount * amountDai) / (amountUsdc * daiDm / usdcDm + amountDai);
        return needUsdcValue;
    }

    function getPreviousTicks(int24 lowerTick, int24 upperTick) public view returns(int24 lowerPrevious, int24 upperPrevious) {
        address ticksFeesReaderAddress = 0x8Fd8Cb948965d9305999D767A02bf79833EADbB3;
        int24[] memory allTicks = TicksFeesReader(ticksFeesReaderAddress).getTicksInRange(
            IPoolStorage(address(pool)), -887272, 150);

        uint256 l = 0;
        uint256 r = allTicks.length - 1;
        uint256 m = 0;

        while (l + 1 < r) {
            m = (l+r)/2;
            if (allTicks[m] <= lowerTick) {
                l = m;
            } else {
                r = m;
            }
        }

        if (allTicks[l] <= lowerTick) lowerPrevious = allTicks[l];
        if (allTicks[r] <= lowerTick) lowerPrevious = allTicks[r];


        l = 0;
        r = allTicks.length - 1;

        while (l + 1 < r) {
            m = (l+r)/2;
            if (allTicks[m] <= upperTick) {
                l = m;
            } else {
                r = m;
            }
        }

        if (allTicks[l] <= upperTick) upperPrevious = allTicks[l];
        if (allTicks[r] <= upperTick) upperPrevious = allTicks[r];
    }

    function _oracleDaiToUsdc(uint256 amount) internal view returns (uint256) {
        uint256 priceUsdc = uint256(oracleUsdc.latestAnswer());
        uint256 priceDai = uint256(oracleDai.latestAnswer());
        return ChainlinkLibrary.convertTokenToToken(amount, daiDm, usdcDm, priceDai, priceUsdc);
    }

    function _oracleUsdcToDai(uint256 amount) internal view returns (uint256) {
        uint256 priceUsdc = uint256(oracleUsdc.latestAnswer());
        uint256 priceDai = uint256(oracleDai.latestAnswer());
        return ChainlinkLibrary.convertTokenToToken(amount, usdcDm, daiDm, priceUsdc, priceDai);
    }
}
