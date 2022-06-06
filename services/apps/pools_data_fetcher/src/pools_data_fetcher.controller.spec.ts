import { Test, TestingModule } from '@nestjs/testing';
import { PoolsDataFetcherController } from './pools_data_fetcher.controller';
import { PoolsDataFetcherService } from './pools_data_fetcher.service';

describe('PoolsDataFetcherController', () => {
  let poolsDataFetcherController: PoolsDataFetcherController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PoolsDataFetcherController],
      providers: [PoolsDataFetcherService],
    }).compile();

    poolsDataFetcherController = app.get<PoolsDataFetcherController>(PoolsDataFetcherController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(poolsDataFetcherController.getHello()).toBe('Hello World!');
    });
  });
});
