
import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, ClientKafka, EventPattern } from '@nestjs/microservices';
import { Pool } from './models/pool';
import { PoolsService } from './pools.service';

@Controller()
export class PoolsController {

  constructor(
    private readonly poolsService: PoolsService,
    @Inject('POOLS_SERVICE') private client: ClientKafka,
  ) {}

  @MessagePattern("pools.get_pools")
  async getPoolsForFetch(): Promise<Pool[]> {
    return await this.poolsService.getPoolsForCheck();
  }
}
