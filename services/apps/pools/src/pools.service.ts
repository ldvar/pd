
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { ConfigService } from '@nestjs/config';

import { DexGuruService } from './services/dex_guru.service';
import { PoolMetadata } from './models/pool';

@Injectable()
export class PoolsService {
  constructor(
    @Inject(CACHE_MANAGER) private poolsCacheManager: Cache,
    private configService: ConfigService,
    private dexGuruService: DexGuruService, //private factoryService: FactoryService,
  ) {}

  async setPoolsCache(pools) {
    await this.poolsCacheManager.set('pools', pools);
  }

  async getPoolsCache() : Promise<PoolMetadata[]> {
    return await this.poolsCacheManager.get('pools');
  }

  async getPoolsForCheck(): Promise<PoolMetadata[]> {
    let pools;

    // Search cache
    pools = await this.getPoolsForCheckFromCache();

    if (pools) {
      return pools;
    }

    // Get data from API
    pools = await this.getPoolsForCheckFromAPI();
    await this.setPoolsCache(pools);

    // Get pools from chain using AMM factories
    //addresses = await this.getPoolsForCheckFromFactories();

    return pools;
  }

  async getPoolsForCheckFromAPI(): Promise<PoolMetadata[]> {
    return await this.getPoolsForCheckFromDexGuru();
  }

  async getPoolsForCheckFromDexGuru(): Promise<PoolMetadata[]> {
    // get amm names
    const [amm_names, types_dict] = await this.dexGuruService.getAllAmmNames();
    // get live amm pools metadata
    const pools = await this.dexGuruService.getAmmPools(amm_names, types_dict);

    return pools;
  }

  /*async getPoolsForCheckFromFactories(): Promise<Pool[]> {
    return null; //TODO
  }*/

  async getPoolsForCheckFromCache(): Promise<PoolMetadata[]> {
    /*const tokenInfo = await this.poolsCacheManager.get("pool_addresses");

    const pools = tokenInfo?.find(
      (c) => c['platform']['name'].toLowerCase() === "polygon", // todo: multichain support
    );*/

    return await this.getPoolsCache();
  }
}
