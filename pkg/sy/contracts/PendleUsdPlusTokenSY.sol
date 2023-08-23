// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import "@pendle/core-v2/contracts/core/StandardizedYield/SYBase.sol";
import "@pendle/core-v2/contracts/core/libraries/Errors.sol";
import "@sion-contracts/common/contracts/libraries/WadRayMath.sol";
import "./interfaces/ISion.sol";

contract PendleSionTokenSY is SYBase {
    using WadRayMath for uint256;

    address public immutable SionToken;

    constructor(
        string memory _name,
        string memory _symbol,
        address _SionToken
    ) SYBase(_name, _symbol, _SionToken) {
        SionToken = _SionToken;
    }

    function _deposit(
        address tokenIn,
        uint256 amountDeposited
    ) internal virtual override returns (uint256 amountSharesOut) {

        if (tokenIn == SionToken) {
            amountSharesOut = amountDeposited.rayDivDown(exchangeRate());
        } else {
            revert Errors.SYInvalidTokenIn(tokenIn);
        }
    }

    function _redeem(
        address receiver,
        address tokenOut,
        uint256 amountSharesToRedeem
    ) internal virtual override returns (uint256 amountTokenOut) {

        if (tokenOut == SionToken) {
            amountTokenOut = amountSharesToRedeem.rayMulDown(exchangeRate());
        } else {
            revert Errors.SYInvalidTokenOut(tokenOut);
        }
        _transferOut(tokenOut, receiver, amountTokenOut);
    }

    function exchangeRate() public view virtual override returns (uint256) {
        return ISionToken(SionToken).liquidityIndex();
    }

    // /*///////////////////////////////////////////////////////////////
    //             MISC FUNCTIONS FOR METADATA
    // //////////////////////////////////////////////////////////////*/

    function _previewDeposit(
        address tokenIn,
        uint256 amountTokenToDeposit
    ) internal view override returns (uint256 amountSharesOut) {

        if (tokenIn == SionToken) {
            amountSharesOut = amountTokenToDeposit.rayDivDown(exchangeRate());
        } else {
            revert Errors.SYInvalidTokenIn(tokenIn);
        }

    }

    function _previewRedeem(
        address tokenOut,
        uint256 amountSharesToRedeem
    ) internal view override returns (uint256 amountTokenOut) {

        if (tokenOut == SionToken) {
            amountTokenOut = amountSharesToRedeem.rayMulDown(exchangeRate());
        } else {
            revert Errors.SYInvalidTokenOut(tokenOut);
        }

    }

    function getTokensIn() public view virtual override returns (address[] memory res) {
        res = new address[](1);
        res[0] = SionToken;
    }

    function getTokensOut() public view virtual override returns (address[] memory res) {
        res = new address[](1);
        res[0] = SionToken;
    }

    function isValidTokenIn(address token) public view virtual override returns (bool) {
        return token == SionToken;
    }

    function isValidTokenOut(address token) public view virtual override returns (bool) {
        return token == SionToken;
    }

    function assetInfo()
    external
    view
    returns (AssetType assetType, address assetAddress, uint8 assetDecimals)
    {
        return (AssetType.TOKEN, SionToken, IERC20Metadata(SionToken).decimals());
    }
}
