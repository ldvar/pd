import { NestFactory } from '@nestjs/core';
import { PoolsDataProcessorModule } from './pools_data_processor.module';
import { Transport } from '@nestjs/microservices';

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
