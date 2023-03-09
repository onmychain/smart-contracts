import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"

describe("SimpleVoting", function () {
    
    async function deploy() {
        const Contract = await ethers.getContractFactory("SimpleVoting")
        const contract = await Contract.deploy()
        await contract.deployed()
        return { contract }
    }

    describe("Creating a ballot", function () {
        it("should create a ballot", async function () {
            const { contract } = await loadFixture(deploy)
            const startTime = await time.latest() + 60 // start the ballot in 60 seconds
            const duration = 300 // the ballot will be open for 300 seconds
            const question = "Who is the greatest rapper of all time?"
            const options = [
                "Tupac Shakur",
                "The Notorious B.I.G.",
                "Eminem",
                "Jay-Z"
            ]
            await contract.createBallot(
                question, options, startTime, duration
            )
            expect(await contract.getBallotByIndex(0)).to.deep.eq([
                question,
                options,
                BigNumber.from(startTime), // convert from uint
                BigNumber.from(duration), // convert from uint
            ])
        })
        it("should revert if the ballot has less than 2 options", async function () {
            const { contract } = await loadFixture(deploy)
            const startTime = await time.latest() + 60 // start the ballot in 60 seconds
            const duration = 300 // the ballot will be open for 300 seconds
            const question = "Who is the greatest rapper of all time?"
            const options = [
                "Tupac Shakur",
                // "The Notorious B.I.G.",
                // "Eminem",
                // "Jay-Z"
            ]
            await expect(contract.createBallot(
                question, options, startTime, duration
            )).to.be.revertedWith("Provide at minimum two options")
        })
        it("should revert if the start time is less than the current time", async function () {
            const { contract } = await loadFixture(deploy)
            const startTime = await time.latest() - 60 // start the ballot 60 seconds before the current time
            const duration = 300 // the ballot will be open for 300 seconds
            const question = "Who is the greatest rapper of all time?"
            const options = [
                "Tupac Shakur",
                "The Notorious B.I.G.",
                "Eminem",
                "Jay-Z"
            ]
            await expect(contract.createBallot(
                question, options, startTime, duration
            )).to.be.revertedWith("Start time must be in the future")
        })
        it("should revert if the duration is less than 1", async function () {
            const { contract } = await loadFixture(deploy)
            const startTime = await time.latest() + 60 // start the ballot in 60 seconds
            const duration = 0 // the ballot will never be open
            const question = "Who is the greatest rapper of all time?"
            const options = [
                "Tupac Shakur",
                "The Notorious B.I.G.",
                "Eminem",
                "Jay-Z"
            ]
            await expect(contract.createBallot(
                question, options, startTime, duration
            )).to.be.revertedWith("Duration must be greater than 0")
        })
    })

})