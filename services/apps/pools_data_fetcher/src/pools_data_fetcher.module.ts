
import { CacheModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {  EthersModule } from "nestjs-ethers"
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EventEmitterModule } from '@nestjs/event-emitter';

//import { ScheduleModule } from '@nestjs/schedule';

import { PoolsDataFetcherService } from './pools_data_fetcher.service';
import { PoolsDataFetcherController } from './pools_data_fetcher.controller';

import { MetaModule, MetaService } from '@positivedelta/meta';

import { ethersConfig, eventEmitterConfig } from '@positivedelta/meta/utils';

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
            useFactory: (config: ConfigService) => {
                return ethersConfig;
            },
        }),
    ],
    
    controllers: [ PoolsDataFetcherController ],
    
    providers: [
        PoolsDataFetcherService, 
        MetaService,
    ],
    
}) export class PoolsDataFetcherModule {}
