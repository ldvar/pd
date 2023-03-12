
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

import { ArbitrageExecuteModule } from './arbitrage_execute.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ArbitrageExecuteModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'EXTERNAL',
        broker: ['localhost:9092'],
      },
      consumer: {
        groupId: 'arbitrage-execute-consumer',
      },
    },
  });

  app.listen();
}

bootstrap();
