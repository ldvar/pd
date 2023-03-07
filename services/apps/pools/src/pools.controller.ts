
import { Controller, Inject, Logger } from '@nestjs/common';

import {
  MessagePattern,
  ClientKafka,
  EventPattern,
} from '@nestjs/microservices';

import { ConfigService } from "@nestjs/config";

import { PoolMetadata } from './models/pool';
import { PoolsService } from './pools.service';


@Controller()
export class PoolsController {
  constructor(
    private readonly poolsService: PoolsService,
    @Inject('POOLS_SERVICE') private client: ClientKafka,
    private readonly configService: ConfigService,
  ) {}

  @MessagePattern('pools.get_pools')
  async getPoolsForFetch(): Promise<PoolMetadata[]> {
    return await this.poolsService.getPoolsForCheck();
  }
}
