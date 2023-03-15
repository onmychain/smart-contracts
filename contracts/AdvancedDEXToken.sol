// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract AdvancedDEXToken is ERC20, ReentrancyGuard {
    using Address for address payable;

    address private immutable _feeReceiver;
    IUniswapV2Router02 private immutable _router;
    address private immutable _weth9;
    address private immutable _pair;
    bool private _trading = false;

    constructor(
        address feeReceiver_
        , address router_
        // , address factory_
    ) ERC20("AdvancedDEXToken", "ADT") {
        _mint(msg.sender, 1000 * 10 ** decimals());
        _feeReceiver = feeReceiver_;
        _router = IUniswapV2Router02(router_);
        _weth9 = _router.WETH();
        _pair = IUniswapV2Factory(_router.factory()).createPair(address(this), _weth9);
    }

    function enableTrading() external {
        _trading = true;
    }

    function _transfer(
        address sender_,
        address recipient_,
        uint256 amount_
    ) internal virtual override {
        if (sender_ == address(this) || !_trading) {
            super._transfer(sender_, recipient_, amount_);
        } else {
            uint fee = (amount_ / 100) * 5; // 5% fee
            uint amt = amount_ - fee;
            
            super._transfer(sender_, address(this), fee);

            if (sender_ != _pair) {
                _distributeFee();
            }

            super._transfer(sender_, recipient_, amt);
        }
    }

    function _distributeFee() internal nonReentrant {
        uint amount = balanceOf(address(this));
        if (amount >= 0) {
            _swapTokensForETH(amount);
        }
    }

    function _swapTokensForETH(uint256 amount_) internal {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = _weth9;
        _approve(address(this), address(_router), amount_);
        _router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amount_,
            0,
            path,
            _feeReceiver,
            block.timestamp
        );
    }
}
