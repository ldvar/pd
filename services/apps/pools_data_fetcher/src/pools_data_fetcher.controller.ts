
import { Controller, Inject, Logger } from '@nestjs/common';

import {
  ClientKafka,
  MessagePattern,
  Payload,
  ServerKafka,
} from '@nestjs/microservices';

import { PoolMetadata } from 'apps/pools/src/models/pool';
import { Observable } from 'rxjs';

import { ConfigService } from "@nestjs/config";

import { PoolsDataFetcherService } from './pools_data_fetcher.service';


const get_pools_pattern = 'pools.get_pools';

@Controller()
export class PoolsDataFetcherController {
  check_pools: PoolMetadata[];

  constructor(
    private readonly poolsDataFetcherService: PoolsDataFetcherService,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject('POOLS_DATA_FETCHER_SERVICE') private client: ClientKafka,
  ) {}

  async onModuleInit() {

    this.client.subscribeToResponseOf(get_pools_pattern);
    await this.client.connect();

    await this.getPools().forEach((pools) => this.setPools(pools));

    while (true) {
      Logger.error("testInit");
      await this.poolsDataFetcherService.fetchDataPacket(this.check_pools);
    }
  }

  setPools(pools) {
    this.check_pools = pools;
  }

  getPools(): Observable<PoolMetadata[]> {
    return this.client.send(get_pools_pattern, {});

    //pools_obs.subscribe(pools => pools = pools);
  }
}
