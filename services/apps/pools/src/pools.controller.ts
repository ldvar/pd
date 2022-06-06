import { Controller, Get } from '@nestjs/common';
import { PoolsService } from './pools.service';

@Controller()
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Get()
  getHello(): string {
    return this.poolsService.getHello();
  }
}
