
import { Module } from '@nestjs/common';

import { ClientsModule, Transport } from '@nestjs/microservices';

import { ArbitrageExecuteController } from './arbitrage_execute.controller';
import { ArbitrageExecuteService } from './arbitrage_execute.service';

@Module({
  imports: [
    ClientsModule.register([
    {
      name: 'POOLS_DATA_FETCHER_SERVICE',
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'EXTERNAL',
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'pools-data-fetcher-consumer',
        },
      },
    },
  ]),],
  controllers: [ArbitrageExecuteController],
  providers: [ArbitrageExecuteService],
})
export class ArbitrageExecuteModule {}
