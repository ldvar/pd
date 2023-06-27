
import { Inject, Injectable, Logger,} from '@nestjs/common';

import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ChainId, Token } from '@uniswap/sdk';

import { PoolRawDataPacket, PoolsRawDataPacket } from '@positivedelta/meta/models/pools_raw_data_packet';
import { PoolProcessedDataPacket, PoolsProcessedDataPacket } from '@positivedelta/meta/models/pools_processed_data_packet';

import { chainId, dodoFlashswapAmmPools } from '@positivedelta/meta/config';
import { TokenMetadata } from "@positivedelta/apps/pools/models/token";
import { PoolMetadata, PoolType } from "@positivedelta/apps/pools/models/pool";
import { SwapMathService } from "@positivedelta/apps/pools_data_processor/services/swap_math.service";

import { FoundPathsDataPacket } from "@positivedelta/apps/pools_data_processor/models/found_path.model";

import { FlashSwapParams, Hop, HotOpportunity, Route } from "@positivedelta/apps/pools_data_processor/models/opportunity.model";

import { PoolProcessedMetadata } from "@positivedelta/apps/pools_data_processor/models/pools_processed_metadata";


@Injectable()
export class PoolsDataProcessorService {
    
    // state data
    public tokens_data: { [address: string]: TokenMetadata };
    public token_sdk_objects: { [address: string]: Token };

    public token_index: { [id: string]: string };

    public pool_index: { [address: string]: PoolMetadata };
    public pool_reverse_index: { [id: number]: string };
    public pool_id_last: number;

    public pools_recent_cache_processed: { [address: string]: PoolProcessedMetadata };


    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private swapMathService: SwapMathService,
    ) {
        this.pool_index = {};
        this.pool_reverse_index = {};
        this.pool_id_last = 0;

        this.pools_recent_cache_processed = {};
    }

    /// state access methods

    getOgIdx(idx: number): number {
        return idx - ( (idx <= this.pool_id_last) ? 0 : this.pool_id_last);
    }

    poolFromIdx(idx: number): PoolMetadata {
        let pool_address = this.pool_reverse_index[this.getOgIdx(idx)];
        return this.pool_index[pool_address];
    }

    ///

    tokenFromSymbol(symb: string): TokenMetadata {
        let token = Object.values(this.tokens_data).find(t => t.symbol == symb);
        return token;
    }

    ///// opportunity object build utils

    getFlashloanAddress(token_symb): string { 
        // TODO implement support for Uniswap V3 and other flashloan providers

        // TODO
        return dodoFlashswapAmmPools[token_symb]; //dodoFlashswapAmmPools[token.symbol];
    }

    getFlashSwapParams(input_token_addr, input_amount, routes: Route[]): FlashSwapParams {
        let params = new FlashSwapParams();
        let symbol = this.tokens_data[input_token_addr].symbol;
        params.pool_address = this.getFlashloanAddress(symbol);
        params.amount =  input_amount;
        params.routes = routes;
        return params;
    }

    /////

    processRawOpportunitiesData(data_packet: FoundPathsDataPacket): HotOpportunity[] {
        let raw_opportunities = [data_packet.edge_paths[0]].map( (edge_path, idx) => { 
            return {
                input_token: this.token_index[data_packet.node_paths[idx][0]],

                swap_data: edge_path.map((edge) => {
                    let direction = edge <= this.pool_id_last;
                    let addr = this.poolFromIdx(edge).address; 
                    
                    let p = this.pools_recent_cache_processed[addr];

                    if (!direction) {
                        p.metadata.token0_address = p.metadata.token1_address;
                        p.metadata.token1_address = p.metadata.token0_address;
                        p = Object.assign(p, { 
                            token0_reserve: p.token1_reserve,
                            token1_reserve: p.token0_reserve
                        });
                    }

                    return p;
                }),
            };
        });
        
        let hot_opportunities_data = raw_opportunities.map( o => {
            let [best_x, best_y] = this.swapMathService.calculateOptimalSwapSequenceParams(o.swap_data);
            return { 
                o: o,
                x: best_x,
                y: best_y
            };
        }).filter(p => p.y && !(p.y<=0) );

        let results = hot_opportunities_data.map( (d) => {
            let o = new HotOpportunity();
        
            let route = new Route();
            route.part = 100;

            route.hops = d.o.swap_data.map(p => {
                return Object.assign(new Hop(), {
                    protocol: p.metadata.type,
                    data: p.metadata.address,
                    path: [ p.metadata.token0_address, p.metadata.token1_address ]
                });
            })
            
            o.input_token = d.o.input_token;
            o.best_input = d.x;
            o.expected_profit = d.y;

            o.swap_data = this.getFlashSwapParams(d.o.input_token, d.x, [ route ]);
            
            return o;
        });

        return results;
    }

    ///

    getLatestGraph(): object[] {
        return Object.entries(this.pool_index).map(([address, pool]) => {
            // return data from variable pool adding token symbols
            return {
                "address": address,
                "internal_id": pool.id,
                "token0": pool.token0_address,
                "token0_symbol": this.tokens_data[pool.token0_address].symbol,
                "token1": pool.token1_address,
                "token1_symbol": this.tokens_data[pool.token1_address].symbol,
                "type": pool.type,
            };
        });
    }

    /// update pools/tokens state

    updateTokensData(tokens_data) {
        this.tokens_data = tokens_data;
        this.token_sdk_objects = {};
        this.token_index = {};

        let i = 0;
        for ( let address in this.tokens_data ) {
            let token_data = this.tokens_data[address];
            token_data.id = i;

            let token_obj = new Token(chainId as ChainId, address, token_data.decimals, token_data.symbol);
            this.token_sdk_objects[address] = token_obj;

            this.token_index[i] = token_data.address;
            i++; //!!!
        }
    }

    updatePoolsIndex(pools: PoolRawDataPacket[]) {
        pools.forEach( pool => {
            if ( !(pool.address in this.pool_index) ) {

                let pool_obj = new PoolMetadata();
                pool_obj.address = pool.address;
                pool_obj.token0_address = pool.token0_address;
                pool_obj.token1_address = pool.token1_address;
                pool_obj.type = pool.type;

                pool_obj.id = this.pool_id_last++;

                this.pool_index[pool.address] = pool_obj;
                this.pool_reverse_index[pool_obj.id] = pool.address;
            }
        })
    }

    ///

    /// data processing procedure

    processRawPoolData(pool_data: PoolRawDataPacket) {
        let result = new PoolProcessedMetadata();
        result.metadata = Object.assign(pool_data);
        
        /// Uniswap V2
        if (pool_data.type == PoolType.UniswapV2) {
            pool_data.token0_reserve = pool_data.value0;
            pool_data.token1_reserve = pool_data.value1;

            let res = this.swapMathService.convertReserves(pool_data, this.token_sdk_objects);

            result.token0_reserve = res.r0;
            result.token1_reserve = res.r1;

        } else {
            /// TODO: Uniswap V3 & Dodo 1&2&3
            
        }

        return result;
    }

    ///

    inverseCopy(pools_metadata: PoolProcessedDataPacket[]) {
        return pools_metadata.map( p => {
            let res = Object.assign(new PoolProcessedDataPacket(), p);
            res.weight = -p.weight;
            res.token0_id = p.token1_id;
            res.token1_id = p.token0_id;
            res.id = p.id + this.pool_id_last + 1;

            return res;
        })
    }

    ///

    processRawDataPacket(pools_data_packet: PoolsRawDataPacket): PoolsProcessedDataPacket {
        let pools_data = pools_data_packet.pools_data;

        // refreshes id -> address & address -> pool metadata mapping
        this.updatePoolsIndex(pools_data);

        // get preprocessed data array with (real/virtual) reserves
        let pre_process_metadata = pools_data.map(p => { return this.processRawPoolData(p); });

        // calculate linear swap weight
        pre_process_metadata = pre_process_metadata.map( p => {
            let r = p;
            r.weight = this.swapMathService.calculateLinearSwapQByReserves(
                p.token0_reserve,
                p.token1_reserve,
                p.metadata.fee);
            return r;
        });

        pre_process_metadata.forEach( p => {
            this.pools_recent_cache_processed[p.metadata.address] = p;
        });
        
        let pools_data_processed = pre_process_metadata.map( (pool_data) => {
            let res = new PoolProcessedDataPacket();
            res.id = this.pool_index[pool_data.metadata.address].id;
            res.weight = this.swapMathService.calculateSwapLogWeight(pool_data.weight);
            res.token0_id = this.tokens_data[pool_data.metadata.token0_address].id;
            res.token1_id = this.tokens_data[pool_data.metadata.token1_address].id;
            return res;
        });

        pools_data_processed = pools_data_processed
            .reduce( (acc, pool_data) => { 
                let ids = acc.map(pool => pool.id);
                return (ids.includes(pool_data.id) ? acc : acc.concat([pool_data]));
            }, [])
            .concat(this.inverseCopy(pools_data_processed));

        let result = new PoolsProcessedDataPacket();
        result.pools_data = pools_data_processed;

        return result;
    }
}
