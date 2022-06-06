import { Controller, Get } from '@nestjs/common';
import { PoolsDataProcessorService } from './pools_data_processor.service';

@Controller()
export class PoolsDataProcessorController {
  constructor(private readonly poolsDataProcessorService: PoolsDataProcessorService) {}

  @Get()
  getHello(): string {
    return this.poolsDataProcessorService.getHello();
  }
}
