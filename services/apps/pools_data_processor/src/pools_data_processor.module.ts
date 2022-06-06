import { Module } from '@nestjs/common';
import { PoolsDataProcessorController } from './pools_data_processor.controller';
import { PoolsDataProcessorService } from './pools_data_processor.service';

@Module({
  imports: [],
  controllers: [PoolsDataProcessorController],
  providers: [PoolsDataProcessorService],
})
export class PoolsDataProcessorModule {}
