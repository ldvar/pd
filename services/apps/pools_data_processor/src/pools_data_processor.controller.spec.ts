import { Test, TestingModule } from '@nestjs/testing';
import { PoolsDataProcessorController } from './pools_data_processor.controller';
import { PoolsDataProcessorService } from './pools_data_processor.service';

describe('PoolsDataProcessorController', () => {
  let poolsDataProcessorController: PoolsDataProcessorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PoolsDataProcessorController],
      providers: [PoolsDataProcessorService],
    }).compile();

    poolsDataProcessorController = app.get<PoolsDataProcessorController>(PoolsDataProcessorController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(poolsDataProcessorController.getHello()).toBe('Hello World!');
    });
  });
});
