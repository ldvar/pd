
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';

import { Contract, Provider as MulticallProvider } from 'ethers-multicall';
  
import {
  InjectEthersProvider,

} from 'nestjs-ethers';

import { ConfigService } from '@nestjs/config';

import { abi as abi_v2 } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as abi_v3 } from "@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json"
import { StaticJsonRpcProvider } from '@ethersproject/providers';

import { PoolMetadata, PoolType } from 'apps/pools/src/models/pool';

import { PoolRawDataPacket, PoolsRawDataPacket } from '@positivedelta/meta/models/pools_raw_data_packet';
import { chainId } from '@positivedelta/meta/config';
import { toHex } from "@uniswap/v3-sdk";

import { ChainId, Token, Pair, TokenAmount, Price } from "@uniswap/sdk";

@Injectable()
export class PoolsDataFetcherService {
  multicallProvider: MulticallProvider;

  constructor(
    @InjectEthersProvider() private readonly provider: StaticJsonRpcProvider,
    @Inject(CACHE_MANAGER) private poolsCacheManager: Cache,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
      this.multicallProvider = new MulticallProvider(this.provider, chainId);
       this.multicallProvider.init();
  }

  ///

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
      default:
        Logger.error("Wrong pool type");
        throw new Error("Wrong pool type");
    }
  }

  ///

  public uni_v2_functions: string[]  = [ 
   "getReserves", 
  ];
  public uni_v3_functions: string[] = [ 
    "slot0" , 
    "liquidity",
  ];


  get_pool_state_preprocessed_data(call_str, call_res) {
    let data = call_str.process_fn(call_res);
    let props = data.map( (val, idx) => [
        call_str.prop_names[idx],
        val
      ]
    );

    return Object.fromEntries(props);
  }

  ///

  createSinglePoolStateFetchCall(contract: Contract, pool_type: PoolType)  {
    switch(pool_type) {
      case PoolType.UniswapV2:
        return { 
          type: PoolType.UniswapV2,
          func_names: this.uni_v2_functions,
          functions: this.uni_v2_functions.map(fn => { 
            return ()=>contract[fn];
          }),
          process_fn: (d) => {
            return [
              d[0][0],
              d[0][1]
            ]
          },
          prop_names: [
            "token0_reserve",
            "token1_reserve"
          ]
        };
      case PoolType.UniswapV3:
        return {
          type: PoolType.UniswapV3,
          func_names: this.uni_v3_functions,
          functions: this.uni_v3_functions.map(fn =>  { 
            return ()=>contract[fn];
          }),
          process_fn: e => { 
            return [
              e[0]["sqrtPriceX96"], 
              e[1]
            ]
          },
          prop_names: [
            "sqrtPriceX96",
            "liquidity"
          ]
        };
      default:
        throw new Error("Wrong pool type");
    };
  }

  ///

  getChainDataHandler(call_st: { call_struct: any; pool: PoolMetadata; }) {
    return (call_res) => {
      let r = new PoolRawDataPacket();
      r = Object.assign(r, call_st.pool)
      let vals = this.get_pool_state_preprocessed_data(call_st.call_struct, call_res);

      switch (call_st.call_struct.type) {
        case PoolType.UniswapV2:
          //r = Object.assign(r, call_st.pool)
          r.value0 = vals["token0_reserve"];
          r.value1 = vals["token1_reserve"];
          return r;
        case PoolType.UniswapV3:
          //r = Object.assign(r, call_st.pool);
          r.value0 = vals["sqrtPriceX96"];
          r.value1 = vals["liquidity"];
          return r;
        default: //not implemented
          throw new Error("Wrong pool type");
      };
    };
  }

  ///

  getCallStruct(p: PoolMetadata) {
    let contract: Contract = this.getMulticallPoolContract(p);
    let call_struct = this.createSinglePoolStateFetchCall(contract, p.type);

    return call_struct;
  }

  buildFullBatchCallStructure(pools) {
    let call_structure = pools.map( (p) => {
      let call_struct = this.getCallStruct(p);
      return call_struct;
    });

    return call_structure;
  }

  ///

  public call_group_fnames = this.uni_v2_functions.concat(this.uni_v3_functions);

  groupCallsByFuncNames(call_struct_arr) {
    // TODO universal impl
    let call_groups_template = Object.fromEntries(
      this.call_group_fnames.map(fname =>
        [ fname, [[]] ]
    ));

    let call_groups = this.call_group_fnames.reduce((red_s, c_g_fname) => {
  
      let call_struct_reshape = call_struct_arr.map((c_str, c_str_i) => {
        return {
          orig_idx: c_str_i,
          orig_c_str: c_str,
        }
      });

      let filtered_call_struct = call_struct_reshape.filter((call_str_data) => {
        return call_str_data.orig_c_str.func_names.includes(c_g_fname);
      });

      let t_res = filtered_call_struct.map(c_str_dt => {
        return {
          orig_idx: c_str_dt.orig_idx,
          contract_call: c_str_dt.orig_c_str.functions[c_str_dt.orig_c_str.func_names.indexOf(c_g_fname)](),
        };
      });

      return { ...red_s, [c_g_fname]: t_res };

    }, call_groups_template);

    return call_groups;
  }

  ///

  async processHomogenicCallBatch(call_group_arr, func_name) {
    let curr_calls_og_idx: number[] = call_group_arr.map(c_st => c_st.orig_idx)
    let curr_calls = call_group_arr.map(c_st => c_st.contract_call);

    let res = (this.multicallProvider.all(
      curr_calls
    )).then(res_a => { 
      let entries = res_a.map( (res_e, res_idx) => {
        let orig_idx = curr_calls_og_idx[res_idx];

        return {
          orig_idx: orig_idx,
          call_str_obj: curr_calls[res_idx],
          res_val: res_e
        };
      });
      
      let objects = entries;
      let result_object = { 
        "func_name": func_name,
        "res_e": objects 
      };
      return result_object;
    });

    let out = await res;

    return out;
  }

  prepareSplitFetchGroups(call_groups) {
    let split_groups = this.call_group_fnames.map( (c_r_fname) => {
      let res = this.processHomogenicCallBatch(
        call_groups[c_r_fname],
         c_r_fname);

      return res;
    });

    return split_groups;
  }

  /// 

  handleSingleDataPacket(pool, c_st, c_st_i, raw_data_structure, ) {
    let data_handler = this.getChainDataHandler({
      call_struct: c_st,
      pool: pool
    });

    let prep_data = data_handler(raw_data_structure);
    return prep_data;
  }

  handleFullBatchProcessing(pools, calls_structure, reshaped_res_data) {
    let pools_prep_data_packets = calls_structure.map((c_st, c_st_i) => {
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
      let data_arr = c_st.func_names.map( (f_n, f_idx) => {
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

    // TODO reimplement as universal processing for multiple AMM/dex types

    let calls_structure = this.buildFullBatchCallStructure(pools);

    let call_groups = this.groupCallsByFuncNames(calls_structure);
    let call_results_group_split = this.prepareSplitFetchGroups(call_groups);

    let out_res = await Promise.all(call_results_group_split);
    let uni_data = this.rebuildCallStructureFromGroups(calls_structure, out_res);

    let pools_raw_data_packets = this.handleFullBatchProcessing(pools, calls_structure, uni_data);

    let output = new PoolsRawDataPacket();    
    output.pools_data = pools_raw_data_packets;

    return output;
  }
}
