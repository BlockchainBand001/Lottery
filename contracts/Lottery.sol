// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lottery {
    // The address of the manager who deploys and manages the contract
    address public manager;

    // An array containing the addresses of participants (players)
    address[] public players;

    // Mapping to store transaction details for each username
    mapping(string => bool) public usernameToTransactionExists;

    // A boolean flag indicating whether the contract is paused
    bool public paused;

    // Constructor - executed once when the contract is deployed
    constructor() {
        // Set the deployer's address as the manager
        manager = msg.sender;
    }

    // Modifier that restricts function execution when the contract is not paused
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // Modifier that restricts function execution to the contract manager
    modifier restricted() {
        require(msg.sender == manager, "Only the manager can call this function.");
        _;
    }

    // Function for participants to enter the lottery by sending Ether
    function enter() public payable whenNotPaused {
        // Require that the sent Ether is more than 0.01 ether
        require(msg.value > 0.01 ether, "Minimum contribution is 0.01 ether.");

        // Add the participant's address to the players array
        players.push(msg.sender);
    }

    // Private function to generate a pseudo-random number using block data and players' addresses
function random() private view returns (uint) {
    // Convert addresses to bytes32 before encoding
    bytes32[] memory addressBytesArray = new bytes32[](players.length);
    for (uint i = 0; i < players.length; i++) {
        addressBytesArray[i] = bytes32(uint256(uint160(players[i])));
    }

    // Calculate a random number using blockhash
    bytes32 randomHash = keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp, addressBytesArray));
    return uint(randomHash);
}

    // Event to log the winner being picked
    event WinnerPicked(address indexed winner, uint prizeAmount);

    // Function for the manager to select a random winner and distribute the prize
    function pickWinner() public restricted whenNotPaused {
        // Require that there are participants in the lottery
        require(players.length > 0, "No participants in the lottery.");

        // Calculate a random index using the random function and players' count
        uint index = random() % players.length;

        // Get the address of the winner
        address winner = players[index];

        // Convert the winner's address to a payable address
        address payable winnerPayable = payable(winner);

        // Transfer the entire contract balance (prize pool) to the winner
        winnerPayable.transfer(address(this).balance);

    // Emit the WinnerPicked event
        emit WinnerPicked(winner, address(this).balance);

        // Reset the players array for the next round
        players = new address[](0);
    }

    // Mapping to store transaction details for each address
    mapping(address => bool) public addressToTransactionExists;

    // Function for participants to withdraw their share of the prize
    function withdraw() public whenNotPaused {
        // Require that the participant has a transaction associated
        require(addressToTransactionExists[msg.sender], "No transaction for this user");

        // Require that the contract balance is greater than zero
        require(address(this).balance > 0, "Contract balance is zero");

        // Calculate the user's share of the contract balance
        uint userBalance = address(this).balance / players.length;

        // Clear the user's transaction existence
        addressToTransactionExists[msg.sender] = false;
        // Transfer the user's balance to their address
        payable(msg.sender).transfer(userBalance);
    }

    // Function for the manager to pause the contract
    function pause() public restricted {
        paused = true;
    }

    // Function for the manager to unpause the contract
    function unpause() public restricted {
        paused = false;
    }

    // Function to check if a transaction exists for the sender's address
    function checkTransactionByAddress(address userAddress) public view returns (bool) {
        return addressToTransactionExists[userAddress];
    }

    // Function to retrieve the list of participants' addresses
    function getPlayers() public view returns (address[] memory) {
        return players;
    }
}
