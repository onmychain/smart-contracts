// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract SimpleVoting {
    // counter enables us to use a mapping
    // instead of an array for the ballots
    // this is more gas effiecient
    uint public counter = 0;

    // the structure of a ballot object
    struct Ballot {
        string question;
        string[] options;
        uint startTime;
        uint duration;
    }

    mapping(uint => Ballot) private _ballots;

    function createBallot(
        string memory question_,
        string[] memory options_,
        uint startTime_,
        uint duration_
    ) external {
        require(duration_ > 0, "Duration must be greater than 0");
        require(startTime_ > block.timestamp, "Start time must be in the future");
        require(options_.length >= 2, "Provide at minimum two options");
        _ballots[counter] = Ballot(question_, options_, startTime_, duration_);
    }

    function getBallotByIndex(uint index_) external view returns (Ballot memory ballot) {
        ballot = _ballots[index_];
    }
}
