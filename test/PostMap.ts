import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
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
        describe("events", function () {
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
        const uri = "some-ipfs-uri"
        let expiry: number
        
        beforeEach(async function () {
            expiry = await time.latest() + (60 * 60)
        })
        
        it("should create a post", async function () {
            const { contract, poster, fee } = await loadFixture(deploy)
            await contract.connect(poster).create(uri, expiry, { value: fee })
            expect(await contract.length()).to.eq(1)
        })
        describe("validations", function () {
            it("should revert if fee incorrect", async function () {
                const { contract, poster } = await loadFixture(deploy)
                await expect(contract.connect(poster).create(uri, expiry, { value: ethers.utils.parseEther("0") })).to.be.revertedWith("Incorrect fee")
            })
        })
        describe("events", function () {
            it("should emit Create event", async function () {
                const { contract, poster, fee } = await loadFixture(deploy)
                await expect(contract.connect(poster).create(uri, expiry, { value: fee })).to.emit(contract, "Create").withArgs(
                    poster.address,
                    uri,
                    expiry,
                    fee
                    )
                })
            })
        })
    describe("clean up posts", function () {

        const uri = "some-ipfs-uri"

        it("should delete old posts", async function () {
            const { contract, poster, fee } = await loadFixture(deploy)
            // create 4 posts
            let expiry = await time.latest() + 60
            await contract.connect(poster).create(uri, expiry, { value: fee })
            expiry += 60
            await contract.connect(poster).create(uri, expiry, { value: fee })
            expiry += 60
            await contract.connect(poster).create(uri, expiry, { value: fee })
            expiry += 60
            await contract.connect(poster).create(uri, expiry, { value: fee })
            expect(await contract.length()).to.eq(4)
            // increase by 130 seconds
            // the first two posts are now expired
            await time.increase(130)
            await contract.cleanup()
            expect(await contract.length()).to.eq(2)
        })
        describe("events", function () {
            it("should emit Remove event", async function () {
                const { contract, poster, fee } = await loadFixture(deploy)
                // create 4 posts
                let expiry = await time.latest() + 60
                await contract.connect(poster).create(uri, expiry, { value: fee })
                expiry += 60
                await contract.connect(poster).create(uri, expiry, { value: fee })
                expiry += 60
                await contract.connect(poster).create(uri, expiry, { value: fee })
                expiry += 60
                await contract.connect(poster).create(uri, expiry, { value: fee })
                // increase by 130 seconds
                // the first two posts are now expired
                await time.increase(130)
                await expect(contract.connect(poster).cleanup()).to.emit(contract, "Remove").withArgs(poster.address, 2)
            })
        })
    })
    describe("remove post", function () {
        const uri = "some-ipfs-uri"
        it("should remove the post at the index", async function () {
            const { contract, poster, fee } = await loadFixture(deploy)
            // create 4 posts
            let expiry = await time.latest()
            await contract.connect(poster).create(uri, expiry, { value: fee })
            await contract.connect(poster).create(uri, expiry, { value: fee })
            await contract.connect(poster).create(uri, expiry, { value: fee })
            await contract.connect(poster).create(uri, expiry, { value: fee })
            expect(await contract.length()).to.eq(4)
            await contract.remove(2)
            expect(await contract.length()).to.eq(3)

        })
        describe("validations", function () {
            it("should revert if not owner", async function () {
                const { contract, poster, fee } = await loadFixture(deploy)
                let expiry = await time.latest()
                await contract.connect(poster).create(uri, expiry, { value: fee })
                await expect(contract.connect(poster).remove(0)).to.be.reverted
            })
        })
        describe("events", function () {
            it("should emit Remove event", async function () {
                const { contract, poster, deployer, fee } = await loadFixture(deploy)
                let expiry = await time.latest()
                await contract.connect(poster).create(uri, expiry, { value: fee })
                await expect(contract.remove(0)).to.emit(contract, "Remove").withArgs(
                    deployer.address, 1
                )
            })
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