import { Module } from '@nestjs/common';
import { PoolsDataFetcherController } from './pools_data_fetcher.controller';
import { PoolsDataFetcherService } from './pools_data_fetcher.service';

@Module({
  imports: [],
  controllers: [PoolsDataFetcherController],
  providers: [PoolsDataFetcherService],
})
export class PoolsDataFetcherModule {}
