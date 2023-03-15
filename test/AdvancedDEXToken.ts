import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { constants } from "ethers"
import { ethers, UniswapV2Deployer } from "hardhat"

interface Fixture {
    token: any
    deployer: any
    account: any
    feeReceiver: any
    factory: any
    router: any
    weth9: any
    pair: any
}

function eth(amount: number) {
    return ethers.utils.parseEther(amount.toString())
}

describe("AdvancedDEXToken", function () {

    async function deploy() {
        const [deployer, account, feeReceiver] = await ethers.getSigners()

        // deploy the uniswap v2 protocol
        const { router, factory, weth9 } = await UniswapV2Deployer.deploy(deployer);

        // deploy our token
        const Token = await ethers.getContractFactory("AdvancedDEXToken")
        const token = await Token.deploy(feeReceiver.address, router.address)
        await token.deployed()

        // approve the spending
        await weth9.approve(router.address, constants.MaxUint256)
        await token.approve(router.address, constants.MaxUint256)

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

        // get pair address
        const pair = await factory.getPair(token.address, weth9.address)

        return { token, deployer, account, feeReceiver, factory, router, weth9, pair }
    }

    describe("disabled", function () {
        it("should not apply fees", async function () {
            const { token, deployer, account } = await loadFixture(deploy)
            const amount = eth(100)
            await expect(token.transfer(account.address, eth(100))).to.changeTokenBalances(
                token,
                [deployer, account],
                [amount.mul(-1), amount]
            )
        })
    })

    describe("enabled", function () {

        let fixture: Fixture

        beforeEach(async function () {
            fixture = await loadFixture(deploy)
            await fixture.token.enableTrading()
        })

        describe("self transfer", function () {
            it("should not apply fees if token contract is transfering", async function () {
                const { token, router, weth9, deployer } = fixture
                await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                    eth(100),
                    1,
                    [token.address, weth9.address],
                    deployer.address,
                    constants.MaxUint256,
                )
                expect(await token.balanceOf(token.address)).to.eq(0)
            })
        })

        describe("buy", function () {
            it("should apply fees", async function () {
                const { router, weth9, token, deployer, feeReceiver, pair } = fixture
                await expect(router.swapETHForExactTokens(
                    eth(100),
                    [weth9.address, token.address],
                    deployer.address,
                    constants.MaxUint256,
                    { value: eth(1000) }
                )).to.changeTokenBalances(token,
                    [deployer, token, pair, feeReceiver],
                    [eth(95), eth(5), eth(100).mul(-1), 0]
                )
            })
            it("should not swap for ETH", async function () {
                const { router, weth9, token, deployer, feeReceiver } = fixture
                await expect(router.swapETHForExactTokens(
                    eth(100),
                    [weth9.address, token.address],
                    deployer.address,
                    constants.MaxUint256,
                    { value: eth(1000) }
                )).to.changeEtherBalance(feeReceiver, 0)
            })
        })

        describe("sell", function () {
            it("should apply fees", async function () {
                const { router, weth9, token, deployer, feeReceiver, pair } = fixture
                // it is difficult to get a test to work here
                // we are taking the fee, but we include it in
                // the swap for ETH, thereby adding it to the pair
                await expect(router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                    eth(100),
                    1,
                    [token.address, weth9.address],
                    deployer.address,
                    constants.MaxUint256,
                )).to.changeTokenBalances(token, [deployer, feeReceiver, pair], [eth(100).mul(-1), 0, eth(100)])
            })
            it("should swap for ETH", async function () {
                const { router, weth9, token, deployer, feeReceiver } = fixture
                const bBalance = await ethers.provider.getBalance(feeReceiver.address)
                await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                    eth(100),
                    1,
                    [token.address, weth9.address],
                    deployer.address,
                    constants.MaxUint256,
                )
                const aBalance = await ethers.provider.getBalance(feeReceiver.address)
                expect(aBalance).to.be.greaterThan(bBalance)
            })
        })
    })
})