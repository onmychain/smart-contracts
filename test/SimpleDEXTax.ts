import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { constants } from "ethers"
import { ethers, UniswapV2Deployer } from "hardhat"

function eth(amount: number) {
    return ethers.utils.parseEther(amount.toString())
}

describe("SimpleDEXTax", function () {
    
    async function deploy() {
        const [deployer, fund, target] = await ethers.getSigners()

        // deploy the uniswap v2 protocol
        const { factory, router, weth9 } = await UniswapV2Deployer.deploy(deployer);

        // deploy our token
        const Token = await ethers.getContractFactory("SimpleDEXTax")
        const token = await Token.deploy(fund.address, factory.address, weth9.address)
        await token.deployed()

        // get our pair
        const pair = new ethers.Contract(await token.pair(), UniswapV2Deployer.Interface.IUniswapV2Pair.abi)

        // approve the spending
        await weth9.approve(router.address, eth(1000))
        await token.approve(router.address, eth(1000))

        // add liquidity
        await router.addLiquidityETH(
            token.address,
            eth(500),
            eth(500),
            eth(10),
            deployer.address,
            constants.MaxUint256,
            { value: eth(10) }
        )
 
        return { token, deployer, fund, target, factory, router, weth9, pair }
    }

    describe("transfer", function () {
        it("should tax on buy", async function () {
            const { router, weth9, token, deployer, fund, pair } = await loadFixture(deploy)
            await expect(router.swapETHForExactTokens(
                eth(100),
                [weth9.address, token.address],
                deployer.address,
                constants.MaxUint256,
                { value: eth(1000) }
            )).to.changeTokenBalances(token, [deployer, fund, pair], [eth(95), eth(5), eth(100).mul(-1)])
        })
        it("should tax on sell", async function () {
            const { router, weth9, token, deployer, fund, pair } = await loadFixture(deploy)
            // since we have a fee, we must call SupportingFeeOnTransferTokens
            await expect(router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                eth(100),
                1,
                [token.address, weth9.address],
                deployer.address,
                constants.MaxUint256,
            )).to.changeTokenBalances(token, [deployer, fund, pair], [eth(100).mul(-1), eth(5), eth(95)])
        })
        it("shouldn't tax on transfer", async function () { 
            const { token, deployer, fund, target } = await loadFixture(deploy)
            await expect(token.transfer(target.address, eth(100))).to.changeTokenBalances(
                token,
                [deployer, fund, target],
                [eth(100).mul(-1), 0, eth(100)]
            )
        })
    })
})