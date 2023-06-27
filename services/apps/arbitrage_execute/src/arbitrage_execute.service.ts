
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EthersContract, EthersSigner, InjectContractProvider, InjectEthersProvider, InjectSignerProvider } from 'nestjs-ethers';

import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import * as ethers from "ethers";

import { HotOpportunity } from "@positivedelta/apps/pools_data_processor/models/opportunity.model";
import * as FlashloanJson from "./abis/Flashloan.json"


@Injectable()
export class ArbitrageExecuteService {
  flashswapContract: Contract;
  wallet: Wallet;

  constructor(
    @InjectEthersProvider() private readonly provider: StaticJsonRpcProvider,
    @InjectSignerProvider() private readonly walletProvider: EthersSigner,
    @InjectContractProvider() private readonly contractProvider: EthersContract,
    private readonly configService: ConfigService,
  ) { // TODO : move env variable access somewhere else
    const priv_key = configService.get<string>("PRIVATE_KEY");
    const flashswapAddr = configService.get<string>("FLASHSWAP_CONTRACT_ADDRESS");
    Logger.error(flashswapAddr);

    this.wallet = walletProvider.createWallet(priv_key).connect(this.provider);

    this.flashswapContract = contractProvider.create(flashswapAddr, FlashloanJson.abi, this.wallet);
    this.flashswapContract = this.flashswapContract.connect(this.wallet);
  }

  // TODO: make it actually work
  // rewrite contract (dodo calls dont work/outdated, dodo is dead in terms of liquidity)
  async dodoFlashloan(params) {
    const funcName = "dodoFlashLoan";
    let func = this.flashswapContract.interface.getFunction(funcName);
    //let args = this.flashswapContract.interface.encodeFunctionData(func, [params]);
    //Logger.error(args);
    //let tx = {
    //  from: this.wallet.address,
    //  to: this.flashswapContract.address,
    //  data: args
    //};
    //let sx = this.wallet.signTransaction(tx);
    //let res = await this.provider.sendTransaction(sx);
    let res = await this.flashswapContract.dodoFlashLoan(params, {
      gasLimit: 2000000,
      gasPrice: ethers.toQuantity("750279094158003"),
    });
    Logger.error(res);
    //Logger.error(res.data.toString());
    Logger.error(":)");
  }

  async executeArbitrage(o: HotOpportunity) {
    let params = {};
    Logger.error("???");

    params["flashLoanPool"] = o.swap_data.pool_address;
    params["loanAmount"] =  o.swap_data.amount;
    params["routes"] = o.swap_data.routes;

    await this.dodoFlashloan(params);
  }

  async handleDataPacket(ops: HotOpportunity[]) {
    // TODO : just for testing for now
    let hot_opp = ops[0];
    await this.executeArbitrage(hot_opp);
  }
}
