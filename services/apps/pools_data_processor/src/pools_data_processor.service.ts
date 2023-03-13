
import { CACHE_MANAGER, Inject, Injectable, Logger,} from '@nestjs/common';

import { Cache } from 'cache-manager';

import { PoolRawDataPacket, PoolsRawDataPacket } from '@positivedelta/meta/models/pools_raw_data_packet';
import { PoolProcessedDataPacket, PoolsProcessedDataPacket } from '@positivedelta/meta/models/pools_processed_data_packet';
import { TokenMetadata } from 'apps/pools/src/models/token';
import { ChainId, Token, TokenAmount } from '@uniswap/sdk';
import { chainId } from '@positivedelta/meta/config';
import { PoolMetadata } from 'apps/pools/src/models/pool';


@Injectable()
export class PoolsDataProcessorService {
    tokens_data: { [address: string]: TokenMetadata };
    token_sdk_objects: { [address: string]: Token };

    token_index: { [id: string]: string };

    pool_index: { [address: string]: PoolMetadata };
    pool_reverse_index: { [id: number]: string };
    pool_id_last: number;
    
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.pool_index = {};
        this.pool_reverse_index = {};
        this.pool_id_last = 0;
    }

    ///

    updateTokensData(tokens_data: { [address: string]: TokenMetadata }) {
        this.tokens_data = tokens_data;
        this.token_sdk_objects = {};
        this.token_index = {};

        let i = 0;
        for ( let address in tokens_data ) {
            let token_data = tokens_data[address];
            token_data.id = i;

            let token_obj = new Token(chainId as ChainId, address, token_data.decimals, token_data.symbol);
            this.token_sdk_objects[address] = token_obj;

            this.token_index[i] = token_data.address;
            i++; //!!!
        }
    }

    /// swap calculations

    calculateAmount(token_address, amount): number {
        const token_amount = new TokenAmount(this.token_sdk_objects[token_address], amount);
        const amount_str = token_amount.toExact();
        return parseFloat(amount_str);
    }

    calculateSwapWeight(p: PoolRawDataPacket): number {
        const fee_k = 1.0 - (p.fee / 1.0e6); // UniswapV2 = TODO implement multiple dex types + fee handling

        const r0 = this.calculateAmount(p.token0_address, p.token0_reserve);
        const r1 = this.calculateAmount(p.token1_address, p.token1_reserve);

        const q = r1 / r0;

        const s = -Math.log(q * fee_k);
        return s;
    }

    ///

    indexPools(pools: PoolRawDataPacket[]) {
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

    inversePoolsDataCopy(pools_data: PoolRawDataPacket[]) {
        return pools_data.map( pool => {
            let res = new PoolRawDataPacket();
            res.address = pool.address;
            res.fee = pool.fee;
            res.type = pool.type;
            res.token0_address = pool.token1_address;
            res.token0_reserve = pool.token1_reserve;
            res.token1_address = pool.token0_address;
            res.token1_reserve = pool.token0_reserve;

            return res;
        })
    }

    /// data processing procedure

    // TODO fix inverse pools packet id associations
    processRawDataPacket(data_packet_one_way: PoolsRawDataPacket): PoolsProcessedDataPacket {
        this.indexPools(data_packet_one_way.pools_data);

        let data_packet = data_packet_one_way;
        let data_packet_second_way = this.inversePoolsDataCopy(data_packet_one_way.pools_data);

        //data_packet.pools_data = data_packet.pools_data.concat(this.inversePoolsDataCopy(data_packet_one_way.pools_data));

        let pool_id_add_value = 110000;
        Logger.error(pool_id_add_value);
        Logger.error(this.tokens_data);
        Logger.error(this.pool_index);

        let transform = (inverse: boolean) => pool_data => {
            let res = new PoolProcessedDataPacket();
            res.id = this.pool_index[pool_data.address].id + (inverse ? pool_id_add_value : 0);
            res.weight = this.calculateSwapWeight(pool_data); 
            res.token0_id = this.tokens_data[pool_data.token0_address].id;
            res.token1_id = this.tokens_data[pool_data.token1_address].id;

            return res;
        }

        const pools_data_processed = data_packet.pools_data
            .map(transform(false))
            .concat(data_packet_second_way.map(transform(true)))
            .reduce((acc: PoolProcessedDataPacket[], pool_data: PoolProcessedDataPacket) => { 
                let ids = acc.map(pool => pool.id);
                return (ids.includes(pool_data.id) ? acc : acc.concat([pool_data]));
             }, [])

        let result = new PoolsProcessedDataPacket();
        result.pools_data = pools_data_processed;

        return result;
    }
}
