
import { Injectable, Logger } from '@nestjs/common';

import { EthersContract, EthersSigner, InjectContractProvider, InjectEthersProvider, InjectSignerProvider } from 'nestjs-ethers';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

import { HotOpportunity } from "apps/pools_data_processor/src/models/opportunity.model";

import * as FlashloanJson from "./abis/Flashloan.json"
import { FlashParams } from './models/IFlashloan';
import { toBigInt } from 'ethers';


@Injectable()
export class ArbitrageExecuteService {
  flashswapContract: Contract;

  constructor(
    @InjectEthersProvider() private readonly provider: StaticJsonRpcProvider,
    @InjectSignerProvider() private readonly walletProvider: EthersSigner,
    @InjectContractProvider() private readonly contractProvider: EthersContract,
  ) { // TODO : move env variable access somewhere else
    const wallet = walletProvider.createWallet(process.env.PRIVATE_KEY);

    this.flashswapContract = contractProvider.create(process.env.FLASHSWAP_CONTRACT_ADDRESS, FlashloanJson.abi, wallet);
    this.flashswapContract.connect(provider);
  }

  dodoFlashloan(params: FlashParams) {
    let func = this.flashswapContract.interface.getFunction("dodoFlashLoan");
    let args = [ params ];
    let encoded = this.flashswapContract.interface.encodeFunctionData(func, args);

    let result = this.flashswapContract[func.name].call(encoded);
    
    return result;
  }

  executeArbitrage(o: HotOpportunity) {
    let params = new FlashParams();
    params.flashLoanPool = o.swap_data.pool_address;
    params.loanAmount = toBigInt( o.best_input);
    params.routes = o.swap_data.routes;

    let result = this.dodoFlashloan(params);

    Logger.error(result);
  }

  handleDataPacket(ops: HotOpportunity[]) {
    // TODO : just for testing for now
    let hot_opp = ops[0];
    this.executeArbitrage(hot_opp);
  }
}
