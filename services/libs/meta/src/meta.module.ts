
import { Module, Global } from '@nestjs/common';
import { ConfigModule} from "@nestjs/config"

import { EthersModule, MATIC_NETWORK } from 'nestjs-ethers';

import { MetaService } from './meta.service';


@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        "../.env"
      ]
    }),
  ],
  providers: [MetaService],
  exports: [MetaService],
})
export class MetaModule { }
