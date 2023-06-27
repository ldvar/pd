
import { Module } from '@nestjs/common';
import { CacheModule } from "@nestjs/cache-manager";
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { eventEmitterConfig } from '@positivedelta/meta/utils';
import { PoolsDataProcessorService } from '@positivedelta/apps/pools_data_processor/pools_data_processor.service';
import { SwapMathService } from '@positivedelta/apps/pools_data_processor/services/swap_math.service';
import { PoolsDataProcessorController } from '@positivedelta/apps/pools_data_processor/pools_data_processor.controller';


@Module({
    imports: [
        EventEmitterModule.forRoot(eventEmitterConfig),
        
        ClientsModule.register([
        {
            name: 'POOLS_DATA_PROCESSOR_SERVICE',
            transport: Transport.KAFKA,
            options: {
                client: {
                    clientId: 'EXTERNAL',
                    brokers: ['localhost:9092'],
                },
                consumer: {
                    groupId: 'pools-data-processor-consumer',
                },
            },
        },
        ]),

        CacheModule.register({
            ttl: 60 * 60 * 24 * 1000,
            isGlobal: true,
        }),
    ],

    controllers: [ PoolsDataProcessorController ],

    providers: [ 
        PoolsDataProcessorService,
        SwapMathService,
    ],

}) export class PoolsDataProcessorModule {}
