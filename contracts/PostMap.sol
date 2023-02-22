// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract PostMap is Ownable {

    struct Post {
        string uri;
        uint expiryTime;
    }
    
    uint public fee;

    Post[] public posts;

    constructor(uint fee_) {
        fee = fee_;
    }

    function length() external view returns (uint) {
        return posts.length;
    }

}
