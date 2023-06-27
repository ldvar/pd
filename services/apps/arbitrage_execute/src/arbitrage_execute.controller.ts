
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from "@nestjs/microservices";

import { patterns } from "@positivedelta/meta/config";

import { HotOpportunity } from "@positivedelta/apps/pools_data_processor/models/opportunity.model";
import { ArbitrageExecuteService } from "@positivedelta/apps/arbitrage_execute/arbitrage_execute.service";


@Controller()
export class ArbitrageExecuteController {
  constructor(
    private readonly arbitrageExecuteService: ArbitrageExecuteService,
  ) {}

  ///

  @EventPattern(patterns.opportunities_realtime)
  async handleFoundOpportunitiesDataPacket(@Payload() data_packet: HotOpportunity[]) {
    Logger.error(data_packet);
    await this.arbitrageExecuteService.handleDataPacket(data_packet);
    
    /*
    const results = await Promise.all(data_packet.map(o => this.arbitrageExecuteService.executeArbitrage(o)));
    
    results.forEach( result => {
      Logger.error("Execution!");
    });
    */
  }
}
