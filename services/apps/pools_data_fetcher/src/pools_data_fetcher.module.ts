
import { CacheModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {  EthersModule } from "nestjs-ethers"
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EventEmitterModule } from '@nestjs/event-emitter';

//import { ScheduleModule } from '@nestjs/schedule';

import { PoolsDataFetcherService } from './pools_data_fetcher.service';
import { PoolsDataFetcherController } from './pools_data_fetcher.controller';

import { MetaModule, MetaService } from '@positivedelta/meta';

import { ethersConfig, ethers_chainId, eventEmitterConfig } from '@positivedelta/meta/utils';
import { MulticallFetcherUtilsService } from './services/multicall_fetcher_utils.service';

@Module({
    imports: [
        EventEmitterModule.forRoot(eventEmitterConfig),
        
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
            ttl: 60 * 60 * 24 * 1000,
            isGlobal: true,
        }),
        
        MetaModule,
        
        EthersModule.forRootAsync({
            imports: [MetaModule],
            inject: [ConfigService],
            //ethersConfig;
            useFactory: (config: ConfigService) => {
                return {
                    network: ethers_chainId,
                    custom: { url: process.env.ALCHEMY_POLYGON_RPC_URL },
                    useDefaultProvider: false,
                }
            },
        }),
    ],
    
    controllers: [ PoolsDataFetcherController ],
    
    providers: [
        PoolsDataFetcherService,
        MulticallFetcherUtilsService,
        MetaService,
    ],
    
}) export class PoolsDataFetcherModule {}
