
import { CacheModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { MetaModule, MetaService } from '@positivedelta/meta';

import { PoolsDataFetcherService } from './pools_data_fetcher.service';
import { PoolsDataFetcherController } from './pools_data_fetcher.controller';

import {  EthersModule, MoralisProvider, getNetworkDefaultProvider } from "nestjs-ethers"

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
    ]),

    CacheModule.register({
      ttl: 60 * 60 * 24,
      isGlobal: true,
    }),

    MetaModule,
    EthersModule.forRoot(),
  ],

  controllers: [ PoolsDataFetcherController ],

  providers: [
    PoolsDataFetcherService, 
    MetaService,
  ],
})
export class PoolsDataFetcherModule {}
