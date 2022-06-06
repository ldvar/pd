import { NestFactory } from '@nestjs/core';
import { ArbitrageExecuteModule } from './arbitrage_execute.module';

async function bootstrap() {
  const app = await NestFactory.create(ArbitrageExecuteModule);
  await app.listen(3000);
}
bootstrap();
