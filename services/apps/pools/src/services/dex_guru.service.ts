
import { Injectable, Logger, Inject } from '@nestjs/common';

import DexGuru, { AmmChoices, ChainChoices, SwapsBurnsMintsListModel, SwapBurnMintModel } from 'dexguru-sdk';

import { chainId, ammTypes, debug_config, pools_config } from '@positivedelta/meta/config';
import { ConfigService } from '@nestjs/config';

import { PoolMetadata, PoolType } from '../models/pool';
import { TokenMetadata } from '../models/token';


@Injectable()
export class DexGuruService {
  sdk: DexGuru;
  dexGuruChainId = chainId.toString() as ChainChoices;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const api_key = configService.get<string>("DEX_GURU_API_KEY");

    this.sdk = new DexGuru(
      api_key,
      'https://api.dev.dex.guru'
    );
    
  }

  async recursiveRequest<D, R extends { total: number; data: D[]}>(sdk_fn: (...sdk_fn_args: any[]) => Promise<R>, ...args: any[]) {
    let raw_result: D[] = [];

    // api pagination limit
    const limit = 100;
    let offset = 0;
    let total = 0;

    while (true) {
      try {
      //let done = true;

      let temp_result = await sdk_fn(...args, undefined, undefined, undefined, limit, offset)
        .catch( (err) => {
          Logger.error(err);
          return { total: 0, data: [] as D[] };
      });

      if (temp_result.data.length <= 0) break;

      offset = raw_result.push(...temp_result.data);

      //if (!done) continue;

      Logger.log("Loading pools metadata... " + offset.toString() + " of " + temp_result.total);

      if (offset >= temp_result.total) break;
      if (offset >= pools_config.metadata_fetch_pools_number_limit) break; // dexguru retries indefinitely after achieving IP request limit...
      } catch (e) {
        
      }
    }

    return raw_result;
  }

  async getAllAmmNames(): Promise<[string[], { [name: string]: string }]> {
    const raw_amms = (await this.sdk.getAllAmmInventory(this.dexGuruChainId)).data;

    // filter by type
    const needed_raw_amms = raw_amms.filter( ammModel =>
      ammTypes.includes(ammModel.type)
    );
    // get names
    const amm_names = needed_raw_amms.map( ammModel => ammModel.name);

    let types_dict = {};
    ammTypes.forEach( ammType => {
      types_dict[ammType] = needed_raw_amms
          .filter((amm) => ammType === amm.type)
          .map((amm) => amm.name);
    });

    Logger.error(needed_raw_amms);

    return [amm_names, types_dict];
  }

  async getAmmPools(amm_names: string[], typesDict): Promise<PoolMetadata[]> {
    let ammChoices = amm_names.join(',');

    let amm_mints = await this.recursiveRequest<SwapBurnMintModel, SwapsBurnsMintsListModel>(
        this.sdk.getAmmsMints,
        this.dexGuruChainId,
        ammChoices,
    );/*,
      amm_burns = await this.recursiveRequest(
        this.sdk.getAmmsBurns,
        this.dexGuruChainId,
        ammChoices,
      );)

    const burned_amm_addresses = amm_burns.map(
      (amm_burn) => amm_burn.pair_address,
    );*/


    let pools = amm_mints
      .reduce((acc, amm_mint) => {
        return acc.keys.includes(amm_mint.pair_address) ?
          acc : { keys: acc.keys.concat([amm_mint.pair_address]),
                  values: acc.values.concat([amm_mint])
        };
      }, { keys: [], values: [] }).values
      .map((amm_mint) => {
        return {
          type: (amm_mint.amm) == "uniswap_v3" ? PoolType.UniswapV3 : PoolType.UniswapV2,
          address: amm_mint.pair_address,
          token0_address: amm_mint.tokens_in[0].address,
          token1_address: amm_mint.tokens_in[1].address,
        } as PoolMetadata;
      });

    Logger.log("Loaded " + pools.length.toString() + " AMM pools");

    return pools;
  }

  async getTokensData(addresses): Promise<{ [name: string]: TokenMetadata }> {
    let tokens_data = {};

    for ( let i = 0; i < addresses.length; ) {
      let token = new TokenMetadata();

      try {
        let data = await this.sdk.getTokenInventoryByAddress(this.dexGuruChainId, addresses[i]);

        token.address = data.address;
        token.symbol = data.symbol;
        token.decimals = data.decimals;

        // use address as a key
        tokens_data[token.address] = token;
      } catch (e) { 
        Logger.error(e);
        continue; 
      }
      i++;
    }
    
    return tokens_data;
  }
}
