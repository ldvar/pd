
import { Injectable } from '@nestjs/common';

import { InjectEthersProvider } from 'nestjs-ethers';

import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { HotOpportunity } from "apps/pools_data_processor/src/models/opportunity.model";


@Injectable()
export class ArbitrageExecuteService {
  constructor(
    @InjectEthersProvider() private readonly provider: StaticJsonRpcProvider,
  ) {}

  executeArbitrage(o: HotOpportunity) {
    
  }

  handleDataPacket(ops: HotOpportunity[]) {

  }
}
