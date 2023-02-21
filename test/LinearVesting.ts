import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("LinearVesting", function () {

    async function deploy() {
        // deploy the token
        const Token = await ethers.getContractFactory("Token")
        const token = await Token.deploy("OnMyChain", "OMC", ethers.utils.parseEther("10000"))
        await token.deployed()

        // generate array of recipients and array of allocations
        // recipients[0] will have allocations[0]
        const recipients = await ethers.getSigners()
        const allocations = recipients.map((r, idx) => ethers.utils.parseEther((idx * 10).toString()))

        const startTime = (await time.latest()) + 60 // starts 60 seconds after deployment
        const duration = 60 * 60 // 1 hour duration

        // deploy the contract
        const Contract = await ethers.getContractFactory("LinearVesting")
        const contract = await Contract.deploy(token.address, recipients.map(s => s.address), allocations, startTime, duration) // add the args
        await contract.deployed()

        return { contract, token, recipients, allocations, startTime, duration }
    }

    // test cases go here
    describe("deployment", function () {
        it('should have a token', async function () {
            const { contract, token } = await loadFixture(deploy)
            expect(await contract.token()).to.eq(token.address)
        })
        it("should have allocations", async function () {
            const { contract, recipients, allocations } = await loadFixture(deploy)
            for (let index = 0; index < recipients.length; index++) {
                const recipient = recipients[index];
                const allocation = allocations[index];
                expect(await contract.allocation(recipient.address)).to.eq(allocation)
            }
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
    })

})