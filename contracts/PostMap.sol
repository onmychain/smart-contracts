// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract PostMap is Ownable {

    struct Post {
        string uri;
        uint expiryTime;
    }

    event SetFee(address sender, uint fee);
    event Create(address sender, string uri, uint expiryTime, uint fee);
    
    uint public fee;

    Post[] public posts;

    constructor(uint fee_) {
        fee = fee_;
    }

    modifier onlyFee {
        require(msg.value == fee, "Incorrect fee");
        _;
    }

    function length() external view returns (uint) {
        return posts.length;
    }

    function setFee(uint fee_) external onlyOwner {
        fee = fee_;
        emit SetFee(msg.sender, fee);
    }

    function create(string calldata uri_, uint expiryTime_) external payable onlyFee {
        posts.push(Post(uri_, expiryTime_));
        emit Create(msg.sender, uri_, expiryTime_, msg.value);
    }

}
