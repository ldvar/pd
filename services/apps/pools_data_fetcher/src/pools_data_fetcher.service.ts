
import { Inject, Injectable, LogLevel, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
Logger.overrideLogger(["log"] as LogLevel[]);

import { Provider as MulticallProvider } from 'ethers-multicall';

import { InjectEthersProvider } from 'nestjs-ethers';
import { ConfigService } from '@nestjs/config';

import { StaticJsonRpcProvider } from '@ethersproject/providers';

import { PoolMetadata } from 'apps/pools/src/models/pool';

import { PoolsRawDataPacket } from '@positivedelta/meta/models/pools_raw_data_packet';
import { chainId, } from '@positivedelta/meta/config';

import { CallStruct } from './models/call';

import { MulticallFetcherUtilsService } from './services/multicall_fetcher_utils.service';
import { call_group_fnames, groupCallsByFuncNames } from './services/realtime_fetch_utils';


@Injectable()
export class PoolsDataFetcherService {
  multicallProvider: MulticallProvider;

  constructor(
    private multicallFetcherUtilsService: MulticallFetcherUtilsService,
    @InjectEthersProvider() private readonly provider: StaticJsonRpcProvider,
    @Inject(CACHE_MANAGER) private poolsCacheManager: Cache,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
      this.multicallProvider = new MulticallProvider(this.provider, chainId);
      this.multicallProvider.init();
  }

  ///

  prepareSplitFetchGroups(call_groups) {
    let split_groups = call_group_fnames.map( (c_r_fname: string) => {
      let res = this.multicallFetcherUtilsService.processHomogenicCallBatch(
        call_groups[c_r_fname],
        c_r_fname,
        this.multicallProvider
      );

      return res;
    });

    return split_groups;
  }

  /// 

  handleSingleDataPacket(pool: PoolMetadata, c_st: CallStruct, c_st_i: number, raw_data_structure ) {
    let data_handler = this.multicallFetcherUtilsService.getChainDataHandler({
      call_struct: c_st,
      pool: pool
    });

    let prep_data = data_handler(raw_data_structure);
    return prep_data;
  }

  handleFullBatchProcessing(pools: PoolMetadata[], calls_structure: CallStruct[], reshaped_res_data) {
    let pools_prep_data_packets = calls_structure.map( (c_st, c_st_i) => {
      let pool_raw_data_packet = this.handleSingleDataPacket(
        pools[c_st_i],
        c_st, c_st_i,
        reshaped_res_data[c_st_i]);

      return pool_raw_data_packet;
    });

    return pools_prep_data_packets;
  }

  ///

  rebuildCallStructureFromGroups(calls_structure, split_output_array) {
    let uni_data = calls_structure.map( (c_st, c_st_i) => {
      let data_arr = c_st.func_names.map( f_n => {
        let out_val = split_output_array.find(o => o.func_name == f_n).res_e
                             .find(o => o.orig_idx == c_st_i);

        return out_val.res_val;
      });
      
      return data_arr;
    });

    return uni_data;
  }

  ///

  async fetchDataPacket(pools: PoolMetadata[]): Promise<PoolsRawDataPacket> {
    Logger.log(">>> loading pools state data");

    // structured representation for funther call splitting
    let calls_structure: CallStruct[] = 
      this.multicallFetcherUtilsService.buildFullBatchCallStructure(pools); //.slice(0,-1);

    // print to debug failing pools
    Logger.error(calls_structure.map(c => {
      return { addr: c.contract.address, type: c.type };
    }));

    // splitting calls by contract function id
    let call_groups = groupCallsByFuncNames(calls_structure);
    // construct actual contract calls with multicall
    Logger.log(">>> building transactions...");
    let call_results_group_split = this.prepareSplitFetchGroups(call_groups);

    // actual contract data fetch
    // TODO: pools service gets partly wrong data for uni_v3 pools from api
    // they just proceed as uni_v2, only this way
    Logger.log(">>> sending transactions...");
    let out_res = await Promise.all(call_results_group_split);

    // reunite contract function calls before processing data
    Logger.log(">>> response received, processing data...");
    Logger.log(out_res);
    let uni_data = this.rebuildCallStructureFromGroups(calls_structure, out_res);
    // process data packets (only build structures and handle data type transforms, more calculations in pools_data_processor service)
    let pools_raw_data_packets = this.handleFullBatchProcessing(pools, calls_structure, uni_data);

    Logger.log(">>> data preprocessing finished, reporting results...");
    Logger.log(pools_raw_data_packets);

    let output = new PoolsRawDataPacket();    
    output.pools_data = pools_raw_data_packets;

    return output;
  }
}
