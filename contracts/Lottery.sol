// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lottery {
    address public manager;
    address[] public players;

    // Mapping to store transaction details for each username
    mapping(string => bool) public usernameToTransactionExists;

    constructor() {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > 0.01 ether, "Minimum contribution is 0.01 ether.");

        players.push(msg.sender);
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }

    function pickWinner() public restricted {
        require(players.length > 0, "No participants in the lottery.");
        uint index = random() % players.length;
        address winner = players[index];
        address payable winnerPayable = payable(winner);
        winnerPayable.transfer(address(this).balance);

        // Reset the players array for the next round
        players = new address[](0);
    }

    modifier restricted() {
        require(msg.sender == manager, "Only the manager can call this function.");
        _;
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    // Function to check if a transaction exists for a given username
    function checkTransactionByUsername(string memory username) public view returns (bool) {
        return usernameToTransactionExists[username];
    }
}