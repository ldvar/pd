
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { CacheModule, CacheStore } from "@nestjs/cache-manager";

import { MetaModule, MetaService } from "@positivedelta/meta";

import { PoolsController } from "@positivedelta/apps/pools/pools.controller";
import { PoolsService } from "@positivedelta/apps/pools/pools.service";

import { DexGuruService } from "@positivedelta/apps/pools/services/dex_guru.service";


import { RedisStore, redisStore } from "cache-manager-redis-store";
const redis_store = redisStore({
    url: "redis://localhost:6379",
});
 
@Module({
  imports: [
    ClientsModule.register([
      {
        name: "POOLS_SERVICE",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "EXTERNAL",
            brokers: ["localhost:9092"],
          },
          consumer: {
            groupId: "pools-consumer",
          },
        },
      },
    ]),

    // initialize redis cache store module here
    //CacheModule.register({store: redis_store as CacheStore & RedisStore, ttl: 5500000}),
    CacheModule.registerAsync({"useFactory": async (...args) => {
      return {
        ttl: 5500000,
        
        store: await redis_store as RedisStore & CacheStore,
      };
    }}),


    MetaModule,
  ],

  controllers: [ PoolsController ],

  providers: [
    PoolsService,
    DexGuruService,
    MetaService,
  ],
})
export class PoolsModule {}

