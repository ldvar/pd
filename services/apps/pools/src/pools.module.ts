import { CacheModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { TokenService } from './services/token.service';
import { MetaModule } from '@positivedelta/meta';
import { FactoryService } from './services/factory.service';

@Module({
  imports: [ 
    ClientsModule.register([{
    name: "POOLS_SERVICE",
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'EXTERNAL',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'pools-consumer'
      },
    }},]),

    CacheModule.register({
      ttl: 60 * 60 * 24,
      isGlobal: true,
    }),

    MetaModule,
  ],

  controllers: [
    PoolsController,
  ],
  
  providers: [
    PoolsService,
    TokenService,
    FactoryService
  ],
})

export class PoolsModule {}
