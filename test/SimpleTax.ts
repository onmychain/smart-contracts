import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

describe("SimpleVoting", function () {
    
    async function deploy() {
        const [deployer, fund, target] = await ethers.getSigners()
        const Contract = await ethers.getContractFactory("SimpleTax")
        const contract = await Contract.deploy(fund.address)
        await contract.deployed()
        return { contract, deployer, fund, target }
    }

    describe("deployment", function () {
        it("should set the fund address", async function () {
            const { contract, fund } = await loadFixture(deploy)
            expect(await contract.fund()).to.eq(fund.address)
        })
    })

    describe("transfer", function () {
        it("should transfer 5% to the fund's address", async function () {
            const { contract, deployer, fund, target } = await loadFixture(deploy)
            const amount = ethers.utils.parseEther("100")
            await expect(contract.transfer(target.address, amount)).to.changeTokenBalances(contract,
                [deployer, fund, target],
                [amount.mul(-1), amount.mul(5).div(100), amount.mul(95).div(100)]
            )
        })
    })
})