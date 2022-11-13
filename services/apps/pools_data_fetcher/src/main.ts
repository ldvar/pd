
import { NestFactory } from '@nestjs/core';
import { PoolsDataFetcherModule } from './pools_data_fetcher.module';
import { Transport } from '@nestjs/microservices';


async function bootstrap() {
  const app = await NestFactory.createMicroservice(PoolsDataFetcherModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: "EXTERNAL",
        broker: ["localhost:9092"],
      },
      consumer: {
        groupId: 'pools-data-fetcher-consumer'
      },
    }
  });
  
  app.listen();
}

bootstrap();
