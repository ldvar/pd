
import { Contract, ContractCall } from "ethers-multicall";

///import { toHex } from "@uniswap/v3-sdk";

import { PoolType } from "apps/pools/src/models/pool";
import { Logger } from "@nestjs/common";
//import { onchain_fetch_config } from "@positivedelta/meta/config";


export class CallStruct {
    public type: PoolType;
    public func_names: string[];
    public functions: ContractCall[];
    public process_fn;
    public prop_names: string[];
    
    public contract: Contract;

    constructor(contract, type, func_names, functions: ContractCall[] | undefined, process_fn, prop_names) {
        this.contract = contract;
        this.type = type;
        this.func_names = func_names;
        this.process_fn = process_fn;
        this.prop_names = prop_names;

        this.buildFunctions();
    }

    buildFunctions() {
        let uniswap_v2_temp = () => { return [
            this.contract.getReserves(),
        ]};
        let uniswap_v3_temp = () => { return [
            this.contract.slot0(),
            this.contract.liquidity()
        ]};
        /*let functions = this.func_names.map(fn => { 
            return this.contract[fn] as ()=>ContractCall;
        });*/

        //this.functions = functions;
        this.functions = ((this.type == PoolType.UniswapV2) ? uniswap_v2_temp : uniswap_v3_temp)();
       
        //Logger.error(this.functions);
        //Logger.error(this.type);
    }

    getContractCall(func_name: string) {
        let func_idx = this.func_names.indexOf(func_name);
        if (func_idx < 0) {
            throw new Error("this call struct can't use this contract method")
        }

        return this.functions[func_idx]; // TODO: datatype handling, toHex?
    }
}
