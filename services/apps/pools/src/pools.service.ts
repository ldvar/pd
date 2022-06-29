
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { FactoryService } from './services/factory.service';
import { Pool } from './models/pool'

@Injectable()
export class PoolsService {
  constructor(
    @Inject(CACHE_MANAGER) private poolsCacheManager: Cache,
    private factoryService: FactoryService,
  ) {}

  async getPoolsForCheck(): Promise<Pool[]> {
    let addresses;

    // Search cache
    addresses = await this.getPoolsForCheckFromCache();

    if (addresses) {
      return addresses;
    }

    addresses = await this.getPoolsForCheckFromFactories();

    this.poolsCacheManager.set(
      "pool_addresses",
      addresses
    );
    
    return addresses;
  }

  async getPoolsForCheckFromFactories(): Promise<Pool[]> {
    let addresses;

    

    return addresses;
  }

  async getPoolsForCheckFromCache(): Promise<Pool[]> {
    let tokenInfo = null;

    tokenInfo = await this.poolsCacheManager.get("pool_addresses");

    const addresses = tokenInfo?.find(
      (c) => c['platform']['name'].toLowerCase() === "polygon", // todo: multichain support
    );

    if (addresses) {
      return addresses;
    }

    return null;
  }
}
