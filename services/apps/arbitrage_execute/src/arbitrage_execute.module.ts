import { Module } from '@nestjs/common';
import { ArbitrageExecuteController } from './arbitrage_execute.controller';
import { ArbitrageExecuteService } from './arbitrage_execute.service';

@Module({
  imports: [],
  controllers: [ArbitrageExecuteController],
  providers: [ArbitrageExecuteService],
})
export class ArbitrageExecuteModule {}
