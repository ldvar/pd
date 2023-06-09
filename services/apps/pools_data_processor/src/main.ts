
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

import { PoolsDataProcessorModule } from './pools_data_processor.module';


async function bootstrap() {
  const app = await NestFactory.createMicroservice(PoolsDataProcessorModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'EXTERNAL',
        broker: ['localhost:9092'],
      },
      consumer: {
        groupId: 'pools-data-processor-consumer',
      },
    },
  });

  app.listen();
}

bootstrap();
