import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";

describe("LinearVesting", function () {

    async function deploy() {
        // deploy the token
        const Token = await ethers.getContractFactory("Token")
        const token = await Token.deploy("OnMyChain", "OMC", ethers.utils.parseEther("10000"))
        await token.deployed()

        // generate array of recipients and array of allocations
        // recipients[0] will have allocations[0]
        const [deployer, recipient0, recipient1] = await ethers.getSigners()
        const recipients = [
            recipient0,
            recipient1
        ]
        const allocations = [
            ethers.utils.parseEther("1000"),
            ethers.utils.parseEther("2000"),
        ]

        const startTime = (await time.latest()) + 60 // starts 60 seconds after deployment
        const duration = 60 * 60 // 1 hour duration

        // deploy the contract
        const Contract = await ethers.getContractFactory("LinearVesting")
        const contract = await Contract.deploy(token.address, [recipient0.address, recipient1.address], allocations, startTime, duration) // add the args
        await contract.deployed()

        // transfer tokens to the contract
        const amount = allocations.reduce((acc, cur) => acc.add(cur), ethers.utils.parseEther("0"))
        await token.transfer(contract.address, amount)

        return { contract, token, allocations, startTime, duration, deployer, recipients }
    }

    // test cases go here
    describe("deployment", function () {
        it('should have a token', async function () {
            const { contract, token } = await loadFixture(deploy)
            expect(await contract.token()).to.eq(token.address)
        })
        it("should have allocations", async function () {
            const { contract, recipients, allocations } = await loadFixture(deploy)
            expect(await contract.allocation(recipients[0].address)).to.eq(allocations[0])
            expect(await contract.allocation(recipients[1].address)).to.eq(allocations[1])
        })
        it("should have a start time", async function () {
            const { contract, startTime } = await loadFixture(deploy)
            expect(await contract.startTime()).to.eq(startTime)
        })
        it("should have a duration", async function () {
            const { contract, duration } = await loadFixture(deploy)
            expect(await contract.duration()).to.eq(duration)
        })
    })

    describe("claim", function () {
        it("should revert before start time", async function () {
            const { contract, recipients } = await loadFixture(deploy)
            for await (const recipient of recipients) {
                await expect(contract.connect(recipient).claim()).to.be.revertedWith("LinearVesting: has not started")
            }
        })
        it("should transfer available tokens", async function () {
            const { contract, token, recipients, allocations, startTime, duration } = await loadFixture(deploy)
            await time.increaseTo(startTime)
            await time.increase((duration / 2) - 1) // increase to 50% of tokens being available

            const allocation = allocations[0];
            const amount = allocation.div(2) // 50%
            await expect(contract.connect(recipients[0]).claim()).to.changeTokenBalances(token,
                [contract, recipients[0]],
                [amount.mul(-1), amount]
            )
        })
        it("should update claimed", async function () {
            const { contract, token, recipients, allocations, startTime, duration } = await loadFixture(deploy)
            await time.increaseTo(startTime)
            await time.increase((duration / 2) - 1) // increase to 50% of tokens being available

            const allocation = allocations[0];
            const amount = allocation.div(2) // 50%
            expect(await contract.claimed(recipients[0].address)).to.eq(0)
            await contract.connect(recipients[0]).claim()
            expect(await contract.claimed(recipients[0].address)).to.eq(amount)
        })

    })

    describe("helpers", function () {
        describe("before start time", function () {

            let contract: Contract
            let recipient: SignerWithAddress
            let allocation: BigNumber

            beforeEach(async function() {
                const fixture = await loadFixture(deploy)
                contract = fixture.contract
                recipient = fixture.recipients[0]
                allocation = fixture.allocations[0]
                await time.increaseTo(fixture.startTime)
            })

            it("should have 0 released", async function () {
                expect(await contract.released(recipient.address)).to.eq(0)
            })
            it("should have 0 available", async function () {
                expect(await contract.available(recipient.address)).to.eq(0)
            })
            it("should have all outstanding", async function () {
                expect(await contract.outstanding(recipient.address)).to.eq(allocation)
            })
        })
    })



})