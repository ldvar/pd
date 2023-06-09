
import { Module, CacheModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { EventEmitterModule } from '@nestjs/event-emitter';

import { PoolsDataProcessorController } from './pools_data_processor.controller';
import { PoolsDataProcessorService } from './pools_data_processor.service';

import { ethers_chainId, eventEmitterConfig } from '@positivedelta/meta/utils';
import { SwapMathService } from './services/swap_math.service';

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
