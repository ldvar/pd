
import { Inject, Injectable, Logger} from '@nestjs/common';
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';

import { ConfigService } from '@nestjs/config';

import { PoolMetadata } from "@positivedelta/apps/pools/models/pool";

import { DexGuruService } from "@positivedelta/apps/pools/services/dex_guru.service";
import { TokensData } from "@positivedelta/apps/pools/models/token";


@Injectable()
export class PoolsService {
  constructor(
    @Inject(CACHE_MANAGER) private poolsCacheManager: Cache,
    private configService: ConfigService,
    private dexGuruService: DexGuruService, //private factoryService: FactoryService,
  ) {}

  //////////////////////////////////

  async setPoolsCache(pools) {
    await this.poolsCacheManager.set("pools", pools);
  }

  async getPoolsCache(): Promise<PoolMetadata[]> {
    return await this.poolsCacheManager.get("pools");
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

  async getPoolsForCheckFromCache(): Promise<PoolMetadata[]> {
    /*const tokenInfo = await this.poolsCacheManager.get("pool_addresses");

    const pools = tokenInfo?.find(
      (c) => c['platform']['name'].toLowerCase() === "polygon", // todo: multichain support
    );*/

    return await this.getPoolsCache();
    
  }

  ////////////////////////////////////////

  async getTokensDataFromCache(): Promise<TokensData> {
    return await this.poolsCacheManager.get('tokens');
  }

  async setTokensDataCache(tokens_data) {
    await this.poolsCacheManager.set('tokens', tokens_data);  
  }

  async getTokensData(): Promise<TokensData> {
    let tokens_data;

    // Search cache
    tokens_data = await this.getTokensDataFromCache();

    if (tokens_data) {
      return tokens_data;
    }

    // Get data from API
    let addresses = await this.getNeededTokensAddresses();

    tokens_data = await this.dexGuruService.getTokensData(addresses);
    await this.setTokensDataCache(tokens_data);

    return tokens_data;
  }

  //////////////////////////////////////

  async getNeededTokensAddresses() {
    const pools = await this.getPoolsForCheck();

    let addresses: string[] = pools.reduce( (s: string[], e) => {
      return s.concat([ e.token0_address, e.token1_address ]);
    }, []).reduce( (s, e) => {
      return s.includes(e) ? s : s.concat([e]);
    }, []);

    return addresses;
  }
}
