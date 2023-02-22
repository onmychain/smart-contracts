import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

describe("PostMap", function () {

    async function deploy() {

        const fee = ethers.utils.parseEther("0.1")

        const Contract = await ethers.getContractFactory("PostMap")
        const contract = await Contract.deploy(fee)
        await contract.deployed()

        const [deployer, poster] = await ethers.getSigners()

        return { contract, fee, deployer, poster }
    }

    describe("deploy", function () {
        it("should have an owner", async function () {
            const { contract, deployer } = await loadFixture(deploy)
            expect(await contract.owner()).to.equal(deployer.address)
        })
        it("should have a fee", async function () {
            const { contract, fee } = await loadFixture(deploy)
            expect(await contract.fee()).to.equal(fee)
        })
        it("should have 0 posts", async function () {
            const { contract } = await loadFixture(deploy)
            expect(await contract.length()).to.equal(0)
        })
    })
    describe("set fee", function () {
        it("should set the fee", async function () {
            const { contract } = await loadFixture(deploy)
            const fee = ethers.utils.parseEther("1.0")
            await contract.setFee(fee)
            expect(await contract.fee()).to.eq(fee)
        })
        describe("validations", function () {
            it("should revert if not owner", async function () {
                const { contract, poster } = await loadFixture(deploy)
                await expect(contract.connect(poster).setFee(ethers.utils.parseEther("0"))).to.be.reverted
            })
        })
        describe("events", function() {
            it("should emit SetFee event", async function () {
                const { contract, deployer } = await loadFixture(deploy)
                const fee = ethers.utils.parseEther("1.0")
                await expect(contract.setFee(fee)).to.emit(contract, "SetFee").withArgs(
                    deployer.address,
                    fee
                )
            })
        })
    })
    describe("create post", function () {
        it("should create a post")
        describe("validations", function () {
            it("should revert if fee incorrect")
        })
        describe("events", function () {
            it("should emit CreatePost event")
        })
    })
    describe("clean up posts", function () {
        it("should delete old posts")
        describe("events", function () {
            it("should emit DeletePost event")
        })
    })
    describe("remove post", function () {
        it("should remove the post at the index")
        describe("validations", function () {
            it("should revert if not owner")
        })
        describe("events", function () {
            it("should emit DeletePost event")
        })
    })
    describe("release funds", function () {
        it("should send funds to address")
        describe("validations", function () {
            it("should revert if not owner")
        })
        describe("events", function () {
            it("should emit Release event")
        })
    })
})