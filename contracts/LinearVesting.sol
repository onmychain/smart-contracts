// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LinearVesting {
    using SafeERC20 for IERC20;

    IERC20 public token;
    
    uint public startTime;
    uint public duration;

    mapping(address => uint) public allocation;
    mapping(address => uint) public claimed;


    constructor(IERC20 token_, address[] memory recipients_, uint[] memory allocations_, uint startTime_, uint duration_) {
        token = token_;
        startTime = startTime_;
        duration = duration_;
        for (uint i = 0; i < recipients_.length; i++) {
            allocation[recipients_[i]] = allocations_[i];
        }
    }

    function claim() external {
        require(block.timestamp >= startTime, "LinearVesting: has not started");
        uint amount = _available(msg.sender);
        token.safeTransfer(msg.sender, amount);
        claimed[msg.sender] += amount;
    }

    function available(address address_) external view returns (uint) {
        return _available(address_);
    }

    function released(address address_) external view returns (uint) {
        return _released(address_);
    }

    function outstanding(address address_) external view returns (uint) {
        return allocation[address_] - _released(address_);
    }

    function _available(address address_) internal view returns (uint) {
        return _released(address_) - claimed[address_];
    }

    function _released(address address_) internal view returns (uint) {
        if (block.timestamp < startTime) {
            return 0;
        } else {
            if (block.timestamp > startTime + duration) {
                return allocation[address_];
            } else {
                return (allocation[address_] * (block.timestamp - startTime)) / duration;
            }
        }
    }
}
