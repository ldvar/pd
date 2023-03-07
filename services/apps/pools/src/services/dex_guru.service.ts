
import { Injectable, Logger, Inject } from '@nestjs/common';

import DexGuru, { AmmChoices, ChainChoices } from 'dexguru-sdk';

import { chainId, ammTypes } from '@positivedelta/meta/config';
import { ConfigService } from '@nestjs/config';

import { PoolMetadata } from '../models/pool';


@Injectable()
export class DexGuruService {
  sdk: DexGuru;
  dexGuruChainId = chainId.toString() as ChainChoices;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const api_key = configService.get<string>("DEX_GURU_API_KEY");
    Logger.error(JSON.stringify(api_key));
    Logger.error(JSON.stringify(configService));
    this.sdk = new DexGuru(
      api_key,
      'https://api.dev.dex.guru',
    );
  }

  async recursiveRequest(sdk_fn: Function, ...args) {
    let raw_result = [];

    // api pagination limit
    const limit = 100;
    let offset = 0;

    while (true) {
      let temp_result = await sdk_fn(...args, undefined, undefined, undefined, limit, offset);
      let temp_length = temp_result.data.length;
      raw_result = raw_result.concat(temp_result.data);

      offset += temp_length;
      Logger.error(raw_result.length);

      if (offset >= temp_result.total || temp_length == 0) break;
    }

    return raw_result;
  }

  async getAllAmmNames(): Promise<[string[], { [name: string]: string }]> {
    const raw_amms = (await this.sdk.getAllAmmInventory(this.dexGuruChainId)).data;
    //await this.recursiveRequest(
    //  this.sdk.getAllAmmInventory,
    //  this.dexGuruChainId,
    //);

    // filter by type
    const needed_raw_amms = raw_amms.filter((ammModel) =>
      ammTypes.includes(ammModel.type),
    );
    // get names
    const amm_names = needed_raw_amms.map((ammModel) => ammModel.name);

    let types_dict = {};
    for (const ammType in ammTypes) {
      types_dict = {
        ...types_dict,
        ammType: needed_raw_amms
          .filter((amm) => ammType === amm.type)
          .map((amm) => amm.name),
      };
    }

    //Logger.debug('Total AMMs: ', dg_pools.total);

    return [amm_names, types_dict];
  }

  async getAmmPools(amm_names: string[], typesDict): Promise<PoolMetadata[]> {
    const ammChoices = amm_names.join(',');

    const amm_mints = await this.recursiveRequest(
        this.sdk.getAmmsMints,
        this.dexGuruChainId,
        ammChoices,
      ),
      amm_burns = await this.recursiveRequest(
        this.sdk.getAmmsBurns,
        this.dexGuruChainId,
        ammChoices,
      );

    const burned_amm_addresses = amm_burns.map(
      (amm_burn) => amm_burn.pair_address,
    );

    const pools = amm_mints
      .filter(
        (amm_mint) => !burned_amm_addresses.includes(amm_mint.pair_address),
      )
      .map((amm_mint) => {
        return {
          type: typesDict[amm_mint.amm],
          address: amm_mint.pair_address,
          token0_address: amm_mint.tokens_in[0].address,
          token1_address: amm_mint.tokens_in[1].address,
        };
      });

    return pools.map((pool) => Object.create(PoolMetadata.prototype, pool));
  }
}
