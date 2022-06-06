import { Test, TestingModule } from '@nestjs/testing';
import { ArbitrageExecuteController } from './arbitrage_execute.controller';
import { ArbitrageExecuteService } from './arbitrage_execute.service';

describe('ArbitrageExecuteController', () => {
  let arbitrageExecuteController: ArbitrageExecuteController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ArbitrageExecuteController],
      providers: [ArbitrageExecuteService],
    }).compile();

    arbitrageExecuteController = app.get<ArbitrageExecuteController>(ArbitrageExecuteController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(arbitrageExecuteController.getHello()).toBe('Hello World!');
    });
  });
});
