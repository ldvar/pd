
import { Contract, ContractCall } from "ethers-multicall";

import { PoolType } from "@positivedelta/apps/pools/models/pool";


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
        // only closure with a standard call syntax worked
        // TODO: move the it to config
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
    }

    getContractCall(func_name: string) {
        let func_idx = this.func_names.indexOf(func_name);
        if (func_idx < 0) {
            throw new Error("this call struct can't use this contract method")
        }

        return this.functions[func_idx]; // TODO: datatype handling, toHex?
    }
}
