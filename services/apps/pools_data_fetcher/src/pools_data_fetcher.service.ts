

import { InjectEthersProvider, AlchemyProvider, MATIC_NETWORK } from 'nestjs-ethers';
import { Contract, Provider } from 'ethers-multicall';

import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';

import { Pool, PoolType } from 'apps/pools/src/models/pool';

import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { BaseProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';


@Injectable()
export class PoolsDataFetcherService {
  multicallProvider: Provider;
  provider: AlchemyProvider;
  constructor(
    @Inject(CACHE_MANAGER) private poolsCacheManager: Cache,
    //@InjectEthersProvider() private readonly provider: AlchemyProvider,
  ) {
    this.provider = new ethers.providers.AlchemyProvider(MATIC_NETWORK, "");
    this.multicallProvider = new Provider(this.provider);
    this.multicallProvider.init();
  }

  getUniswapV3MulticallPoolContract(pool: Pool) {
    const contract = new Contract(pool.address, IUniswapV3PoolABI);
    this.multicallProvider.all([contract])
  } 

  async fetchDataPacket(pools: Pool[]) {
    pools.map( (pool) => {
      const contract = this.getMulticallPoolContract(pool);
      const call = 
    })
  }
}
