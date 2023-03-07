
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';

import { Provider as MulticallProvider } from 'ethers-multicall';
import {
  //InjectEthersProvider,
  POLYGON_NETWORK,
  EthersContract,
  getNetworkDefaultProvider
} from 'nestjs-ethers';
import {  } from "ethers/types/providers/";

import { ConfigService } from '@nestjs/config';

import { abi } from "@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json"

import { PoolMetadata } from 'apps/pools/src/models/pool';

//import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json';
//import { BaseProvider } from '@ethersproject/providers';


@Injectable()
export class PoolsDataFetcherService {
  multicallProvider: MulticallProvider;
  provider: any;

  constructor(
    @Inject(CACHE_MANAGER) private poolsCacheManager: Cache,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
    const apiKey = configService.get<string>("MORALIS_API_KEY");
    Logger.error(apiKey);
    getNetworkDefaultProvider(POLYGON_NETWORK,
        { moralis: { apiKey: apiKey, region: "eu-central-1"} })
        .then( provider => { 
            this.provider = provider;
            this.multicallProvider = new MulticallProvider(this.provider); 
            this.multicallProvider.init();
        });
        
  }

  async getUniswapV3MulticallPoolContract(pool: PoolMetadata) {
    
    const contract = new EthersContract(this.provider).create(pool.address, abi);
    Logger.error(JSON.stringify(contract));
    Logger.error("test");
    
    //const call = await this.multicallProvider.all();
    
  }

  async fetchDataPacket(pools: PoolMetadata[]) {

    pools.map((pool) => {
      //const contract = this.getMulticallPoolContract(pool);
      const call = null;
    });
  }
}
