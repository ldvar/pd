import { Module } from '@nestjs/common';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';

@Module({
  imports: [],
  controllers: [PoolsController],
  providers: [PoolsService],
})
export class PoolsModule {}
