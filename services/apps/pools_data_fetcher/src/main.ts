import { NestFactory } from '@nestjs/core';
import { PoolsDataFetcherModule } from './pools_data_fetcher.module';

async function bootstrap() {
  const app = await NestFactory.create(PoolsDataFetcherModule);
  await app.listen(3000);
}
bootstrap();
