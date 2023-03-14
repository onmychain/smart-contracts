import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@onmychain/hardhat-uniswap-v2-deploy-plugin";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
};

export default config;
