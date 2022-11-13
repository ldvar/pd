import { CacheModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { MetaModule } from '@positivedelta/meta';

import { PoolsDataFetcherService } from './pools_data_fetcher.service';
import { PoolsDataFetcherController } from './pools_data_fetcher.controller';


@Module({
  imports: [ 
    ClientsModule.register([{
    name: "POOLS_DATA_FETCHER_SERVICE",
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'EXTERNAL',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'pools-data-fetcher-consumer'
      },
    }},]),

    CacheModule.register({
      ttl: 60 * 60 * 24,
      isGlobal: true,
    }),

    MetaModule,
  ],

  controllers: [
    PoolsDataFetcherController
  ],
  
  providers: [
    PoolsDataFetcherService,
  ],
})

export class PoolsDataFetcherModule {}
