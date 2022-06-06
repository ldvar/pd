import { Controller, Get } from '@nestjs/common';
import { PoolsDataFetcherService } from './pools_data_fetcher.service';

@Controller()
export class PoolsDataFetcherController {
  constructor(private readonly poolsDataFetcherService: PoolsDataFetcherService) {}

  @Get()
  getHello(): string {
    return this.poolsDataFetcherService.getHello();
  }
}
