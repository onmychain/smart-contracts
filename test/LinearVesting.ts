import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("LinearVesting", function () {

    async function deploy() {
        // deploy the token
        const Token = await ethers.getContractFactory("Token")
        const token = await Token.deploy("OnMyChain", "OMC", ethers.utils.parseEther("10000"))
        await token.deployed()

        // generate array of recipients and array of allocations
        // recipients[0] will have allocations[0]
        const recipients = (await ethers.getSigners()).map(s => s.address)
        const allocations = recipients.map((r, idx) => ethers.utils.parseEther((idx * 10).toString()))

        // deploy the contract
        const Contract = await ethers.getContractFactory("LinearVesting")
        const contract = await Contract.deploy(token.address, recipients, allocations) // add the args
        await contract.deployed()

        return { contract, token, recipients, allocations }
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
                expect(await contract.allocation(recipient)).to.eq(allocation)
            }
        })
    })

})