
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PoolsDataProcessorController } from './pools_data_processor.controller';
import { PoolsDataProcessorService } from './pools_data_processor.service';


@Module({
  imports: [
    ClientsModule.register([{
      name: "POOLS_DATA_PROCESSOR_SERVICE",
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'EXTERNAL',
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'pools-data-processor-consumer'
        },
      }},]),
  ],

  controllers: [
    PoolsDataProcessorController
  ],

  providers: [
    PoolsDataProcessorService
  ],
})
export class PoolsDataProcessorModule {}
