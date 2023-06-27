
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MetaService } from "@positivedelta/meta/meta.service";


@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ["libs/meta/.env"],
      isGlobal: true,
      cache: true,
    }),
  ],
  providers: [ MetaService ],
  exports: [ MetaService ],
})
export class MetaModule {}
