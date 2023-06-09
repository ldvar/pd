
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class TokenService {
  private static client;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  static getInstance() {
    if (this.client) {
      return this.client;
    }

    //this.client = new CoinMarketCap(process.env.COINMARKETCAP_API_KEY);

    return this.client;
  }

  public async getTokenAddress(tokenSymbol: string, chainName: string) {
    let address;

    // Search cache
    address = await this.getTokenDetailsFromCache(tokenSymbol, chainName);

    //Search CoinMarketCap
    if (!address) {
      address = await this.getTokenDetailsFromApi(tokenSymbol, chainName);
    }

    return address;
  }

  async getTokenDetailsFromCache(tokenSymbol: string, chainName: string) {
    let tokenInfo = null;

    tokenInfo = await this.cacheManager.get(tokenSymbol);

    const address = tokenInfo?.find(
      (_) => true,
      //(c) => c['platform']['name'].toLowerCase() === chainName.toLowerCase(),
    );

    if (address) {
      return address.contract_address;
    }

    return null;
  }

  async getTokenDetailsFromApi(tokenSymbol: string, chainName: string) {
    const result = await TokenService.getInstance().getMetadata({
      symbol: tokenSymbol,
    });

    if (
      typeof result.status.error_code == 'undefined' ||
      result.status.error_code > 0
    ) {
      Logger.error('Error get token info from CoinMarketCap.', result);
      //throw new ApiConnectionException();
    }

    //Add to cache
    await this.cacheManager.set(
      tokenSymbol,
      result.data[tokenSymbol].contract_address,
    );

    const address = result.data[tokenSymbol].contract_address.find(
      (c) => c.platform.name.toLowerCase() === chainName.toLowerCase(),
    );

    if (address) {
      return address.contract_address;
    }

    return null;
  }
}
