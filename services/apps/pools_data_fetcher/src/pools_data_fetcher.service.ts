
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';

import { Contract, ContractCall, Provider as MulticallProvider } from 'ethers-multicall';
import {
  BINANCE_NETWORK,
  POLYGON_NETWORK,
  InjectEthersProvider,
} from 'nestjs-ethers';

import { ConfigService } from '@nestjs/config';

import { abi as abi_v2 } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as abi_v3 } from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"
import { BaseProvider, StaticJsonRpcProvider } from '@ethersproject/providers';

import { PoolMetadata, PoolType } from 'apps/pools/src/models/pool';

import { PoolRawDataPacket, PoolsRawDataPacket } from '@positivedelta/meta/models/pools_raw_data_packet';
import { chainId } from '@positivedelta/meta/config';
import { toHex } from '@uniswap/v3-sdk';
import { FallbackProvider } from 'ethers';

const ethers_chainId = BINANCE_NETWORK;
//const ethers_chainId = POLYGON_NETWORK;

@Injectable()
export class PoolsDataFetcherService {
  multicallProvider: MulticallProvider;
  //provider: BaseProvider;

  constructor(
    @InjectEthersProvider() private readonly provider: StaticJsonRpcProvider,
    @Inject(CACHE_MANAGER) private poolsCacheManager: Cache,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
    //(_ => this.provider
     // .then( async (p) => {
       // this.provider = p;
        this.multicallProvider = new MulticallProvider(this.provider, chainId);
        this.multicallProvider.init();
    //  }
    //);
  }

  getUniswapV3MulticallPoolContract(pool: PoolMetadata): Contract {
    return new Contract(pool.address, abi_v3);
  }

  getUniswapV2MulticallPoolContract(pool: PoolMetadata): Contract {
    return new Contract(pool.address, abi_v2);
  }

  getMulticallPoolContract(pool: PoolMetadata): Contract {
    switch(pool.type) {
      case PoolType.UniswapV2: 
        return this.getUniswapV2MulticallPoolContract(pool);
      case PoolType.UniswapV3:
        return this.getUniswapV3MulticallPoolContract(pool);
    }
  }

  async fetchDataPacket(pools: PoolMetadata[]): Promise<PoolsRawDataPacket> {
    let calls: ContractCall[] = pools.filter(pool => pool.type == PoolType.UniswapV2).map((pool) => {
      let contract = this.getMulticallPoolContract(pool);
      
      let call = contract.getReserves();
      return call;
    });

    const calls_result = await this.multicallProvider.all(calls);
    
    let result = calls_result.map(([r0, r1, _], idx) => {
      let packet = new PoolRawDataPacket();
      let pool = pools[idx];
      Object.assign(packet, pool);
      packet.token0_reserve = toHex(r0);
      packet.token1_reserve = toHex(r1);
      packet.fee = 3000;

      return packet;
    });

    let output = new PoolsRawDataPacket();
    output.pools_data = result;
    return output;
  }
}
