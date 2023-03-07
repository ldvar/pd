
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

import { PoolsDataFetcherModule } from './pools_data_fetcher.module';


async function bootstrap() {
  const app = await NestFactory.createMicroservice(PoolsDataFetcherModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'EXTERNAL',
        broker: ['localhost:9092'],
      },
      consumer: {
        groupId: 'pools-data-fetcher-consumer',
      },
    },
  });

  app.listen();
}

bootstrap();
