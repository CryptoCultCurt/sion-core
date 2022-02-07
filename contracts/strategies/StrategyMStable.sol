// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "../interfaces/IStrategy.sol";
import "../connectors/mstable/interfaces/IMasset.sol";
import "../connectors/mstable/interfaces/ISavingsContract.sol";
import "../connectors/mstable/interfaces/IBoostedVaultWithLockup.sol";
import "../connectors/BalancerExchange.sol";
import "../connectors/QuickswapExchange.sol";

import "hardhat/console.sol";

contract StrategyMStable is IStrategy, AccessControlUpgradeable, UUPSUpgradeable {

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERC20 public usdcToken;
    IMasset public mUsdToken;
    ISavingsContractV2 public imUsdToken;
    IBoostedVaultWithLockup public vimUsdToken;
    IERC20 public mtaToken;
    IERC20 public wmaticToken;
    BalancerExchange public balancerExchange;
    QuickswapExchange public quickswapExchange;
    bytes32 public balancerPoolId1;
    bytes32 public balancerPoolId2;
    uint256 public usdcTokenDenominator;
    uint256 public vimUsdTokenDenominator;
    uint256 public mtaTokenDenominator;
    uint256 public wmaticTokenDenominator;


    // --- events

    event StrategyMStableUpdate(address usdcToken, address mUsdToken, address imUsdToken, address vimUsdToken, address mtaToken,
        address wmaticToken, address balancerExchange, address quickswapExchange, bytes32 balancerPoolId1, bytes32 balancerPoolId2,
        uint256 usdcTokenDenominator, uint256 vimUsdTokenDenominator, uint256 mtaTokenDenominator, uint256 wmaticTokenDenominator);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() initializer public {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    // ---  modifiers

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Restricted to admins");
        _;
    }

    // --- Setters

    function setParams(
        address _usdcToken,
        address _mUsdToken,
        address _imUsdToken,
        address _vimUsdToken,
        address _mtaToken,
        address _wmaticToken,
        address _balancerExchange,
        address _quickswapExchange,
        bytes32 _balancerPoolId1,
        bytes32 _balancerPoolId2
    ) external onlyAdmin {
        require(_usdcToken != address(0), "Zero address not allowed");
        require(_mUsdToken != address(0), "Zero address not allowed");
        require(_imUsdToken != address(0), "Zero address not allowed");
        require(_vimUsdToken != address(0), "Zero address not allowed");
        require(_mtaToken != address(0), "Zero address not allowed");
        require(_wmaticToken != address(0), "Zero address not allowed");
        require(_balancerExchange != address(0), "Zero address not allowed");
        require(_quickswapExchange != address(0), "Zero address not allowed");
        require(_balancerPoolId1 != "", "Empty pool id not allowed");
        require(_balancerPoolId2 != "", "Empty pool id not allowed");

        usdcToken = IERC20(_usdcToken);
        mUsdToken = IMasset(_mUsdToken);
        imUsdToken = ISavingsContractV2(_imUsdToken);
        vimUsdToken = IBoostedVaultWithLockup(_vimUsdToken);
        mtaToken = IERC20(_mtaToken);
        wmaticToken = IERC20(_wmaticToken);
        balancerExchange = BalancerExchange(_balancerExchange);
        quickswapExchange = QuickswapExchange(_quickswapExchange);
        balancerPoolId1 = _balancerPoolId1;
        balancerPoolId2 = _balancerPoolId2;
        usdcTokenDenominator = 10 ** IERC20Metadata(_usdcToken).decimals();
        vimUsdTokenDenominator = 10 ** IERC20Metadata(_vimUsdToken).decimals();
        mtaTokenDenominator = 10 ** IERC20Metadata(_mtaToken).decimals();
        wmaticTokenDenominator = 10 ** IERC20Metadata(_wmaticToken).decimals();

        emit StrategyMStableUpdate(_usdcToken, _mUsdToken, _imUsdToken, _vimUsdToken, _mtaToken, _wmaticToken,
            _balancerExchange, _quickswapExchange, _balancerPoolId1, _balancerPoolId2, usdcTokenDenominator,
            vimUsdTokenDenominator, mtaTokenDenominator, wmaticTokenDenominator);
    }

    function _authorizeUpgrade(address newImplementation)
    internal
    onlyRole(UPGRADER_ROLE)
    override
    {}


    // --- logic

    function stake(
        address _asset,
        uint256 _amount
    ) public override {
        require(_asset == address(usdcToken), "Unstake only in usdc");

        usdcToken.approve(address(mUsdToken), _amount);

        uint256 mintedTokens = mUsdToken.mint(address(usdcToken), _amount, 0, address(this));

        mUsdToken.approve(address(imUsdToken), mintedTokens);
        uint256 savedTokens = imUsdToken.depositSavings(mintedTokens, address(this));

        imUsdToken.approve(address(vimUsdToken), savedTokens);
        vimUsdToken.stake(address(this), savedTokens);
    }

    function unstake(
        address _asset,
        uint256 _amount,
        address _beneficiary
    ) public override returns (uint256) {
        require(_asset == address(usdcToken), "Unstake only in usdc");

        // 18 = 18 + 6 - 6
        uint256 tokenAmount = vimUsdTokenDenominator * _amount / _getVimUsdBuyPrice();

        vimUsdToken.withdraw(tokenAmount);

        imUsdToken.redeem(imUsdToken.balanceOf(address(this)));

        mUsdToken.redeem(address(usdcToken), mUsdToken.balanceOf(address(this)), 0, address(this));

        uint256 redeemedTokens = usdcToken.balanceOf(address(this));
        usdcToken.transfer(_beneficiary, redeemedTokens);

        return redeemedTokens;
    }

    function netAssetValue() external override view returns (uint256) {
        uint256 balance = vimUsdToken.balanceOf(address(this));
        uint256 price = _getVimUsdBuyPrice();
        // 18 + 6 - 18 = 6
        return balance * price / vimUsdTokenDenominator;
    }

    function liquidationValue() external override view returns (uint256) {
        uint256 balance = vimUsdToken.balanceOf(address(this));
        uint256 price = _getVimUsdSellPrice();
        // 18 + 6 - 18 = 6
        return balance * price / vimUsdTokenDenominator;
    }

    function _getVimUsdBuyPrice() internal view returns (uint256) {
        uint256 mintOutput = mUsdToken.getMintOutput(address(usdcToken), usdcTokenDenominator);
        // 6 + 18 - 18 = 6
        return usdcTokenDenominator * vimUsdTokenDenominator / imUsdToken.underlyingToCredits(mintOutput);
    }

    function _getVimUsdSellPrice() internal view returns (uint256) {
        uint256 underlying = imUsdToken.creditsToUnderlying(vimUsdTokenDenominator);
        // 6 = 6
        return mUsdToken.getRedeemOutput(address(usdcToken), underlying);
    }

    function claimRewards(address _to) external override returns (uint256) {
        vimUsdToken.claimReward();

        uint256 totalUsdc;

        uint256 mtaBalance = mtaToken.balanceOf(address(this));
        if (mtaBalance != 0) {
//            uint256 mtaUsdc = balancerExchange.batchSwap(balancerPoolId1, balancerPoolId2, IVault.SwapKind.GIVEN_IN,
//                IAsset(address(mtaToken)), IAsset(address(wmaticToken)), IAsset(address(usdcToken)), address(this),
//                address(_to), mtaBalance);
            uint256 wmaticTokenBalance = balancerExchange.swap(balancerPoolId1, IVault.SwapKind.GIVEN_IN, IAsset(address(mtaToken)),
                IAsset(address(wmaticToken)), address(this), address(this), mtaBalance);
            uint256 mtaUsdc = balancerExchange.swap(balancerPoolId2, IVault.SwapKind.GIVEN_IN, IAsset(address(wmaticToken)),
                IAsset(address(usdcToken)), address(this), address(_to), wmaticTokenBalance);
            totalUsdc += mtaUsdc;
        }

        uint256 wmaticBalance = wmaticToken.balanceOf(address(this));
        if (wmaticBalance != 0) {
            uint256 wmaticUsdc = quickswapExchange.swapTokenToUsdc(address(wmaticToken), address(usdcToken),
                wmaticTokenDenominator, address(this), address(_to), wmaticBalance);
            totalUsdc += wmaticUsdc;
        }

        return totalUsdc;
    }
}
