
import { Controller, Inject } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';

import { PoolsRawDataPacket } from '@positivedelta/meta/models/pools_raw_data_packet';

import { PoolsDataProcessorService } from './pools_data_processor.service';

@Controller()
export class PoolsDataProcessorController {

  constructor(
    private readonly poolsDataProcessorService: PoolsDataProcessorService,
    @Inject('POOLS_DATA_PROCESSOR_SERVICE') private client: ClientKafka,
  ) {}
  
  @EventPattern("pools.datastream.raw")
  async processDataPacket(@Payload() data_packet: PoolsRawDataPacket) {
    let processed_packet = this.poolsDataProcessorService.processRawDataPacket(data_packet);
    this.client.emit("pools.datastream.processed", processed_packet);
  }
}
