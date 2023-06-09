
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from "@nestjs/microservices";

import { FoundPathsDataPacket } from "apps/pools_data_processor/src/models/found_path.model";
import { HotOpportunity } from "apps/pools_data_processor/src/models/opportunity.model";

import { patterns } from "@positivedelta/meta/config";

import { ArbitrageExecuteService } from './arbitrage_execute.service';

//

@Controller()
export class ArbitrageExecuteController {
  constructor(
    private readonly arbitrageExecuteService: ArbitrageExecuteService,
  ) {}

  ///

  @EventPattern(patterns.opportunities_primary_found)
  async handleFoundOpportunitiesDataPacket(@Payload() data_packet: HotOpportunity[]) {
    let handled_packet = await this.arbitrageExecuteService.handleDataPacket(data_packet);
    
    /*
    const results = await Promise.all(data_packet.map(o => this.arbitrageExecuteService.executeArbitrage(o)));
    
    results.forEach( result => {
      Logger.error("Execution!");
    });
    */
  }
}
