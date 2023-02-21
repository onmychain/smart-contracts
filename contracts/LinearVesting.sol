// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LinearVesting {
    using SafeERC20 for IERC20;

    IERC20 public token;
    
    uint public startTime;
    uint public duration;

    mapping(address => uint) public allocation;


    constructor(IERC20 token_, address[] memory recipients_, uint[] memory allocations_, uint startTime_, uint duration_) {
        token = token_;
        startTime = startTime_;
        duration = duration_;
        for (uint i = 0; i < recipients_.length; i++) {
            allocation[recipients_[i]] = allocations_[i];
        }
    }

    function claim() external {
        require(block.timestamp > startTime, "LinearVesting: has not started");
    }
}
