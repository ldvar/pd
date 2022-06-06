import { NestFactory } from '@nestjs/core';
import { PoolsDataProcessorModule } from './pools_data_processor.module';

async function bootstrap() {
  const app = await NestFactory.create(PoolsDataProcessorModule);
  await app.listen(3000);
}
bootstrap();
