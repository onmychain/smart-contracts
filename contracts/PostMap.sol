// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract PostMap is Ownable {

    struct Post {
        string uri;
        uint expiryTime;
    }

    event SetFee(address sender, uint fee);
    event Create(address sender, string uri, uint expiryTime, uint fee);
    event Remove(address sender, uint amount);
    
    uint public fee;
    address payable private payee;

    Post[] public posts;

    constructor(address payable payee_, uint fee_) {
        payee = payee_;
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
        Address.sendValue(payee, address(this).balance);
        posts.push(Post(uri_, expiryTime_));
        emit Create(msg.sender, uri_, expiryTime_, msg.value);
    }

    function cleanup() external {
        uint counter = 0;
        for (uint i = 0; i < posts.length; i++) {
            Post memory post = posts[i];
            if (post.expiryTime < block.timestamp) {
                uint j = posts.length - 1;
                posts[i] = posts[j];
                posts.pop();
                counter++;
            }
            delete post;
        }
        if (counter > 0) {
            emit Remove(msg.sender, counter);
        }
    }

    function remove(uint index_) external onlyOwner {
        uint len = posts.length;
        uint last = len - 1;
        require(index_ < len);
        if (len > 1) {
            if (index_ < last) {
                posts[index_] = posts[last];
            }
        }
        posts.pop();
        emit Remove(msg.sender, 1);
    }

    function setPayee(address payable payee_) external onlyOwner {
        payee = payee_;
    }

}
