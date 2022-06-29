
import { Module, Global } from '@nestjs/common';
import { MetaService } from './meta.service';
import { ConfigModule } from "@nestjs/config"


@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        "../production.env"
      ]
    })
  ],
  providers: [MetaService],
  exports: [MetaService],
})
export class MetaModule {}
