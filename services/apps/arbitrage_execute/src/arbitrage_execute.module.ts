
import { Module } from '@nestjs/common';

import { EthersModule } from 'nestjs-ethers';
import { ConfigService } from '@nestjs/config';

import { ClientsModule, Transport } from '@nestjs/microservices';

import { ArbitrageExecuteController } from './arbitrage_execute.controller';
import { ArbitrageExecuteService } from './arbitrage_execute.service';

import { ethers_chainId } from '@positivedelta/meta/utils';
import { MetaModule } from '@positivedelta/meta';


@Module({
  imports: [
    ClientsModule.register([{
      name: 'ARBITRAGE_EXECUTE_SERVICE',
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'EXTERNAL',
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'arbitrage-execute-consumer',
        },
      },
    }]),

    EthersModule.forRootAsync({
      imports: [MetaModule],
      inject: [ConfigService],
      //ethersConfig;
      useFactory: (config: ConfigService) => {
          return {
              network: ethers_chainId,
              custom: { url: process.env.ALCHEMY_POLYGON_RPC_URL },
              useDefaultProvider: false,
          }
      },
  }),
  
  ],

  controllers: [ArbitrageExecuteController],
  providers: [ArbitrageExecuteService],
})
export class ArbitrageExecuteModule { }
