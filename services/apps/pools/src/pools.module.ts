
import { CacheModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { MetaModule, MetaService} from '@positivedelta/meta';

import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';

import { TokenService } from './services/token.service';
import { FactoryService } from './services/factory.service';
import { DexGuruService } from './services/dex_guru.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'POOLS_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'EXTERNAL',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'pools-consumer',
          },
        },
      },
    ]),

    CacheModule.register({
      ttl: 60 * 60 * 24,
      isGlobal: true,
    }),

    MetaModule,
  ],

  controllers: [PoolsController],

  providers: [
    PoolsService,
    TokenService,
    FactoryService,
    DexGuruService,
    MetaService,
  ],
})
export class PoolsModule {}
