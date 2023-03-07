import { Controller } from '@nestjs/common';
import { ArbitrageExecuteService } from './arbitrage_execute.service';

@Controller()
export class ArbitrageExecuteController {
  constructor(
    private readonly arbitrageExecuteService: ArbitrageExecuteService,
  ) {}
}
