import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

import { PoolsModule } from './pools.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(PoolsModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'EXTERNAL',
        broker: ['localhost:9092'],
      },
      consumer: {
        groupId: 'pools-consumer',
      },
    },
  });

  app.listen();
}

bootstrap();
