import { NestFactory } from '@nestjs/core';
import { PoolsModule } from './pools.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(PoolsModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: "EXTERNAL",
        broker: ["localhost:9092"],
      },
    }
  });
  
  app.listen();
}

bootstrap();
