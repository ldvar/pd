import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PoolsService } from './pools.service';

@Controller()
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  //@MessagePattern()
  //getHello(): string {
  //  return this.poolsService.getHello();
  //}
}
