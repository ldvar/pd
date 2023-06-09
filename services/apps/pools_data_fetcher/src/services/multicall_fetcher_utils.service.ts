
import { Contract } from "ethers-multicall";

import { Injectable, Logger } from "@nestjs/common";

import { abi as abi_v2 } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as abi_v3 } from "@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json"

import { PoolMetadata, PoolType } from "apps/pools/src/models/pool";
import { CallStruct } from "../models/call";
import { get_uniswap_v2_call_struct, get_uniswap_v3_call_struct } from "./realtime_fetch_utils";

import { PoolRawDataPacket } from "@positivedelta/meta/models/pools_raw_data_packet";


@Injectable()
export class MulticallFetcherUtilsService {

    getUniswapV3MulticallPoolContract(pool: PoolMetadata): Contract {
        return new Contract(pool.address, abi_v3);
    }

    getUniswapV2MulticallPoolContract(pool: PoolMetadata): Contract {
        return new Contract(pool.address, abi_v2);
    }


    getMulticallPoolContract(pool: PoolMetadata): Contract {
        switch (pool.type) {
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

    getCallStruct(p: PoolMetadata): CallStruct {
        let contract: Contract = this.getMulticallPoolContract(p);
        let call_struct = this.createSinglePoolStateFetchCall(contract, p.type);

        return call_struct;
    }

    buildFullBatchCallStructure(pools: PoolMetadata[]) {
        let call_structure = pools.map(p => {
            let call_struct = this.getCallStruct(p);
            return call_struct;
        });

        return call_structure;
    }

    ///

    createSinglePoolStateFetchCall(contract: Contract, pool_type: PoolType) {
        switch (pool_type) {
            case PoolType.UniswapV2:
                return get_uniswap_v2_call_struct(contract);
            case PoolType.UniswapV3:
                return get_uniswap_v3_call_struct(contract);
            default:
                throw new Error("Wrong pool type");
        };
    }

    ///

    getChainDataHandler(call_st: { call_struct: CallStruct; pool: PoolMetadata; }) {
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

    get_pool_state_preprocessed_data(call_str: CallStruct, call_res) {
        let data = call_str.process_fn(call_res);
        let props = data.map((val, idx) => [
            call_str.prop_names[idx], // fetch output property name
            val // not processed value
        ]
        );

        return Object.fromEntries(props);
    }

    /// 

    async processHomogenicCallBatch(call_group_arr, func_name, provider) {
        let curr_calls_og_idx: number[] = call_group_arr.map( c_st => c_st.orig_idx)
        let curr_calls = call_group_arr.map( c_st => c_st.contract_call);
    
        let res = await provider.all(
          curr_calls
        ).then(res_a => { 
          let entries = res_a.map( (res_e, res_idx: number) => {
            let orig_idx = curr_calls_og_idx[res_idx];
    
            return {
              orig_idx: orig_idx,
              call_str_obj: curr_calls[res_idx],
              res_val: res_e
            };
          });
          
          let objects = entries;
          let result_object = { 
            func_name: func_name as string,
            res_e: objects 
          };
          return result_object;
        });
    
        return res;
      }
}
