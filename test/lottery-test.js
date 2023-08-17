const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery Contract", function () {
    let lotteryContract;
    let owner;
    let player1;
    let player2;

    beforeEach(async () => {
        const Lottery = await ethers.getContractFactory("Lottery");
        lotteryContract = await Lottery.deploy();
        await lotteryContract.deployed();

        [owner, player1, player2] = await ethers.getSigners();
    });

    it("should allow participants to enter the lottery", async function () {
        await lotteryContract.connect(player1).enter({ value: ethers.utils.parseEther("0.02") });

        const players = await lotteryContract.getPlayers();
        expect(players).to.have.lengthOf(1);
        expect(players[0]).to.equal(player1.address);
    });

    it("should not allow participants to enter with less than the minimum contribution", async function () {
        await expect(lotteryContract.connect(player1).enter({ value: ethers.utils.parseEther("0.005") }))
            .to.be.revertedWith("Minimum contribution is 0.01 ether.");
    });

    it("should allow the manager to pick a winner and distribute the prize", async function () {
        await lotteryContract.connect(player1).enter({ value: ethers.utils.parseEther("0.02") });
        await lotteryContract.connect(player2).enter({ value: ethers.utils.parseEther("0.02") });

        const initialBalance = await ethers.provider.getBalance(player1.address);

        await lotteryContract.connect(owner).pickWinner();

        const finalBalance = await ethers.provider.getBalance(player1.address);
        expect(finalBalance.gt(initialBalance)).to.be.true;
    });

    it("should not allow anyone other than the manager to pick a winner", async function () {
        await expect(lotteryContract.connect(player1).pickWinner())
            .to.be.revertedWith("Only the manager can call this function.");
    });

    it("should reset the players array after picking a winner", async function () {
        await lotteryContract.connect(player1).enter({ value: ethers.utils.parseEther("0.02") });
        await lotteryContract.connect(player2).enter({ value: ethers.utils.parseEther("0.02") });

        await lotteryContract.connect(owner).pickWinner();

        const playersAfterPick = await lotteryContract.getPlayers();
        expect(playersAfterPick).to.have.lengthOf(0);
    });

    it("should allow participants to withdraw their winnings", async function () {
        await lotteryContract.connect(player1).enter({ value: ethers.utils.parseEther("0.02") });
        await lotteryContract.connect(player2).enter({ value: ethers.utils.parseEther("0.02") });

        await lotteryContract.connect(owner).pickWinner();

        const initialBalance = await ethers.provider.getBalance(player1.address);

        await lotteryContract.connect(player1).withdraw();

        const finalBalance = await ethers.provider.getBalance(player1.address);
        expect(finalBalance.gt(initialBalance)).to.be.true;
    });

    it("should not allow participants to withdraw if they haven't participated", async function () {
        await expect(lotteryContract.connect(player1).withdraw())
            .to.be.revertedWith("No transaction for this user");
    });

    it("should not allow participants to withdraw if the contract balance is zero", async function () {
        await lotteryContract.connect(player1).enter({ value: ethers.utils.parseEther("0.02") });
        await lotteryContract.connect(player2).enter({ value: ethers.utils.parseEther("0.02") });

        await lotteryContract.connect(owner).pickWinner();

        await expect(lotteryContract.connect(player1).withdraw())
            .to.be.revertedWith("Contract balance is zero");
    });

    it("should allow the manager to pause and unpause the contract", async function () {
        await lotteryContract.connect(owner).pause();
        expect(await lotteryContract.paused()).to.be.true;

        await lotteryContract.connect(owner).unpause();
        expect(await lotteryContract.paused()).to.be.false;
    });

    it("should not allow participants to enter when the contract is paused", async function () {
        await lotteryContract.connect(owner).pause();

        await expect(lotteryContract.connect(player1).enter({ value: ethers.utils.parseEther("0.02") }))
            .to.be.revertedWith("Contract is paused");
    });

    it("should allow participants to check their transaction status by address", async function () {
        await lotteryContract.connect(player1).enter({ value: ethers.utils.parseEther("0.02") });
        await lotteryContract.connect(player2).enter({ value: ethers.utils.parseEther("0.02") });

        const transactionExistsPlayer1 = await lotteryContract.checkTransactionByAddress(player1.address);
        expect(transactionExistsPlayer1).to.be.true;

        const transactionExistsPlayer2 = await lotteryContract.checkTransactionByAddress(player2.address);
        expect(transactionExistsPlayer2).to.be.true;
    });

    it("should allow participants to check their transaction status by username", async function () {
        const username = "player1";
        await lotteryContract.connect(player1).enter({ value: ethers.utils.parseEther("0.02") });
        await lotteryContract.connect(player2).enter({ value: ethers.utils.parseEther("0.02") });
        await lotteryContract.connect(owner).setTransactionByUsername(username);

        const transactionExistsByUsername = await lotteryContract.checkTransactionByUsername(username);
        expect(transactionExistsByUsername).to.be.true;
    });

    // Add more test cases to cover various scenarios

});
