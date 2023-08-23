// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@sion-contracts/core/contracts/interfaces/ISion.sol";
import "@sion-contracts/core/contracts/interfaces/IExchange.sol";
import "./interfaces/IMarket.sol";
import "./interfaces/IWrappedSion.sol";

contract Market is IMarket, Initializable, AccessControlUpgradeable, UUPSUpgradeable {

    IERC20 public usdcToken;
    ISionToken public SionToken;
    IWrappedSionToken public wrappedSionToken;

    IExchange public exchange;


    // --- events

    event MarketUpdatedTokens(
        address usdcToken,
        address SionToken,
        address wrappedSionToken
    );

    event MarketUpdatedParams(address exchange);

    event Wrap(
        address asset,
        uint256 amount,
        address receiver,
        uint256 wrappedUsdPlusAmount
    );

    event Unwrap(
        address asset,
        uint256 amount,
        address receiver,
        uint256 unwrappedUsdPlusAmount
    );


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() initializer public {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation)
    internal
    onlyRole(DEFAULT_ADMIN_ROLE)
    override
    {}


    // ---  modifiers

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Restricted to admins");
        _;
    }


    // --- Setters

    function setTokens(
        address _usdcToken,
        address _SionToken,
        address _wrappedSionToken
    ) external onlyAdmin {

        require(_usdcToken != address(0), "Zero address not allowed");
        require(_SionToken != address(0), "Zero address not allowed");
        require(_wrappedSionToken != address(0), "Zero address not allowed");

        usdcToken = IERC20(_usdcToken);
        SionToken = ISionToken(_SionToken);
        wrappedSionToken = IWrappedSionToken(_wrappedSionToken);

        emit MarketUpdatedTokens(_usdcToken, _SionToken, _wrappedSionToken);
    }

    function setParams(
        address _exchange
    ) external onlyAdmin {

        require(_exchange != address(0), "Zero address not allowed");

        exchange = IExchange(_exchange);

        emit MarketUpdatedParams(_exchange);
    }


    // --- logic

    /**
     * @dev preview wrap `amount` of `asset` to wUSD+.
     *
     * This is an estimate amount, real amount may vary.
     *
     * Requirements:
     *
     * - `asset` cannot be the zero address.
     * - `amount` cannot be the zero.
     */
    function previewWrap(
        address asset,
        uint256 amount
    ) external view override returns (uint256) {
        require(asset != address(0), "Zero address for asset not allowed");
        require(amount != 0, "Zero amount not allowed");

        if (asset == address(usdcToken)) {
            uint256 buyFeeAmount = (amount * exchange.buyFee()) / exchange.buyFeeDenominator();
            return wrappedSionToken.previewDeposit(amount - buyFeeAmount);
        } else if (asset == address(SionToken)) {
            return wrappedSionToken.previewDeposit(amount);
        } else {
            revert('Asset not found');
        }
    }

    /**
     * @dev preview unwrap `amount` of wUSD+ to `asset`.
     *
     * This is an estimate amount, real amount may vary.
     *
     * Requirements:
     *
     * - `asset` cannot be the zero address.
     * - `amount` cannot be the zero.
     */
    function previewUnwrap(
        address asset,
        uint256 amount
    ) external view override returns (uint256) {
        require(asset != address(0), "Zero address for asset not allowed");
        require(amount != 0, "Zero amount not allowed");

        if (asset == address(usdcToken)) {
            uint256 usdPlusAmount = wrappedSionToken.previewRedeem(amount);
            uint256 redeemFeeAmount = (usdPlusAmount * exchange.redeemFee()) / exchange.redeemFeeDenominator();
            return usdPlusAmount - redeemFeeAmount;
        } else if (asset == address(SionToken)) {
            return wrappedSionToken.previewRedeem(amount);
        } else {
            revert('Asset not found');
        }
    }

    /**
     * @dev Wrap `amount` of `asset` from `msg.sender` to wUSD+ of `receiver`.
     *
     * Emits a {Wrap} event.
     *
     * Requirements:
     *
     * - `asset` cannot be the zero address.
     * - `amount` cannot be the zero.
     * - `receiver` cannot be the zero address.
     */
    function wrap(
        address asset,
        uint256 amount,
        address receiver
    ) external override returns (uint256) {
        require(asset != address(0), "Zero address for asset not allowed");
        require(amount != 0, "Zero amount not allowed");
        require(receiver != address(0), "Zero address for receiver not allowed");

        uint256 wrappedUsdPlusAmount;
        if (asset == address(usdcToken)) {
            usdcToken.transferFrom(msg.sender, address(this), amount);

            usdcToken.approve(address(exchange), amount);
            uint256 usdPlusAmount = exchange.buy(asset, amount);

            SionToken.approve(address(wrappedSionToken), usdPlusAmount);
            wrappedUsdPlusAmount = wrappedSionToken.deposit(usdPlusAmount, receiver);

        } else if (asset == address(SionToken)) {
            SionToken.transferFrom(msg.sender, address(this), amount);

            SionToken.approve(address(wrappedSionToken), amount);
            wrappedUsdPlusAmount = wrappedSionToken.deposit(amount, receiver);

        } else {
            revert('Asset not found');
        }

        emit Wrap(asset, amount, receiver, wrappedUsdPlusAmount);

        return wrappedUsdPlusAmount;
    }

    /**
     * @dev Unwrap `amount` of wUSD+ from `msg.sender` to `asset` of `receiver`.
     *
     * Emits a {Unwrap} event.
     *
     * Requirements:
     *
     * - `asset` cannot be the zero address.
     * - `amount` cannot be the zero.
     * - `receiver` cannot be the zero address.
     */
    function unwrap(
        address asset,
        uint256 amount,
        address receiver
    ) external override returns (uint256) {
        require(asset != address(0), "Zero address for asset not allowed");
        require(amount != 0, "Zero amount not allowed");
        require(receiver != address(0), "Zero address for receiver not allowed");

        uint256 unwrappedUsdPlusAmount;
        if (asset == address(usdcToken)) {
            wrappedSionToken.transferFrom(msg.sender, address(this), amount);

            wrappedSionToken.approve(address(wrappedSionToken), amount);
            uint256 usdPlusAmount = wrappedSionToken.redeem(amount, address(this), address(this));

            SionToken.approve(address(exchange), usdPlusAmount);
            unwrappedUsdPlusAmount = exchange.redeem(asset, usdPlusAmount);

            usdcToken.transfer(receiver, unwrappedUsdPlusAmount);

        } else if (asset == address(SionToken)) {
            wrappedSionToken.transferFrom(msg.sender, address(this), amount);

            wrappedSionToken.approve(address(wrappedSionToken), amount);
            unwrappedUsdPlusAmount = wrappedSionToken.redeem(amount, receiver, address(this));

        } else {
            revert('Asset not found');
        }

        emit Unwrap(asset, amount, receiver, unwrappedUsdPlusAmount);

        return unwrappedUsdPlusAmount;
    }

}
