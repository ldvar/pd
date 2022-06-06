import { NestFactory } from '@nestjs/core';
import { PoolsModule } from './pools.module';

async function bootstrap() {
  const app = await NestFactory.create(PoolsModule);
  await app.listen(3000);
}
bootstrap();
