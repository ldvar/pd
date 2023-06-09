
import { Contract } from "ethers-multicall"

import { PoolType } from "apps/pools/src/models/pool"

import { onchain_fetch_config } from "@positivedelta/meta/config"

import { CallStruct } from "../models/call"
import { toHex } from "@uniswap/v3-sdk";

export const call_group_fnames = 
                        onchain_fetch_config.abi_functions_patterns.uniswap_v2
    .concat(  onchain_fetch_config.abi_functions_patterns.uniswap_v3);


export function get_uniswap_v2_call_struct(contract: Contract): CallStruct {
    let call_str = new CallStruct(
        contract,
        PoolType.UniswapV2,
        onchain_fetch_config.abi_functions_patterns.uniswap_v2,
        undefined,
        (d) => {
            return [
                d[0][0],
                d[0][1],
            ].map(toHex);
        },
        [
            "token0_reserve",
            "token1_reserve"
        ]
    );

    return call_str;
}

export function get_uniswap_v3_call_struct(contract: Contract): CallStruct {
    let call_str = new CallStruct(
        contract,
        PoolType.UniswapV3,
        onchain_fetch_config.abi_functions_patterns.uniswap_v3,
        undefined,
        (e) => {
            return [
                e[0]["sqrtPriceX96"],
                e[1],
            ];
        },
        [
            "sqrtPriceX96",
            "liquidity"
        ]
    );

    return call_str;
}

/// data array util functions

export function groupCallsByFuncNames(call_struct_arr: CallStruct[]) {
    // TODO: full dex-independent implementation
    let call_groups_template = Object.fromEntries(
        call_group_fnames.map((fname: string) =>
            [fname, [[]]],
        ));

    let call_groups = call_group_fnames.reduce((red_s, c_g_fname: string) => {

        let call_struct_reshape = call_struct_arr.map((c_str, c_str_i) => {
            return {
                orig_idx: c_str_i,
                orig_c_str: c_str,
            }
        });

        let filtered_call_struct = call_struct_reshape.filter(call_str_data => {
            return call_str_data.orig_c_str.func_names.includes(c_g_fname);
        });

        let t_res = filtered_call_struct.map(c_str_dt => {
            let contract_call = c_str_dt.orig_c_str.getContractCall(c_g_fname);
            return {
                orig_idx: c_str_dt.orig_idx,
                contract_call: contract_call, 
            };
        });

        return { ...red_s, [c_g_fname]: t_res };

    }, call_groups_template);

    return call_groups;
}
