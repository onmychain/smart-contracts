import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("XPToken", function () {

    const amount = ethers.utils.parseEther("1")

    async function deploy() {
        // deploy the token
        const Token = await ethers.getContractFactory("XPToken")
        const token = await Token.deploy()
        await token.deployed()
        const [owner, other] = await ethers.getSigners()
        return { token, owner, other }
    }

    // test cases go here
    describe("deployment", function () {
       it("Should have an owner", async function () {
        const { token, owner } = await loadFixture(deploy)
        expect(await token.owner()).to.eq(owner.address)
       })
       it("Should have zero supply", async function () {
        const { token } = await loadFixture(deploy)
        expect( await token.totalSupply()).to.eq(0)
       })
    })

    describe("mint", function () {
        it("Should mint tokens to account", async function () {
            const { token, other } = await loadFixture(deploy)
            await expect(token.mint(other.address, amount)).to.changeTokenBalance(token, other, amount)
        })
        it("Should increase account allowance", async function () {
            const { token, other, owner } = await loadFixture(deploy)
            expect(await token.allowance(other.address, owner.address)).to.eq(0)
            await token.mint(other.address, amount)
            expect(await token.allowance(other.address, owner.address)).to.eq(amount)
        })
        it("Should revert if not owner", async function () {
            const { token, other } = await loadFixture(deploy)
            await expect(token.connect(other).mint(other.address, amount)).to.be.reverted
        })
    })

    describe("burn", function () {

        let token: Contract, other: SignerWithAddress

        beforeEach(async function () {
            const _ = { token, other } = await loadFixture(deploy)
            await token.mint(other.address, amount)
        })

        it("Should burn tokens belonging to account", async function () {
            await expect(token.burnFrom(other.address, amount)).to.changeTokenBalance(token, other, amount.mul(-1))
        })
        it("Should revert if not owner", async function () {
            await expect(token.connect(other).burnFrom(other.address, amount)).to.be.reverted
        })
    })

})