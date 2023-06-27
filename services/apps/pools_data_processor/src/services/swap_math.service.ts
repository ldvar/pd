
import { Injectable, Logger, Inject } from '@nestjs/common';

import { BigintIsh, Token, TokenAmount } from "@uniswap/sdk";

const math = require('mathjs');

import { PoolRawDataPacket } from "@positivedelta/meta/models/pools_raw_data_packet";
import { PoolProcessedMetadata } from '@positivedelta/apps/pools_data_processor/models/pools_processed_metadata';


@Injectable()
export class SwapMathService {
    // convertations

    calculateVirtualReservesFromState(liquidity, sqrtPriceX96) {
        return {
            r0: liquidity / sqrtPriceX96,
            r1: liquidity * sqrtPriceX96 
        };
    }

    ////

    calculateSingleSwapOutput(input_amount, swap_data: PoolProcessedMetadata) {
        let weight = swap_data.weight;
        let price_impact_factor = this.priceImpactCorrectionMultiplier(input_amount, swap_data.token0_reserve);

        return input_amount * price_impact_factor * weight;
    }

    // function that receives a list of pool metadata and returns a function that calculates swap sequence output
    calculateSwapSequenceOutput(input_amount, swap_sequence) {
        let output_amount = swap_sequence.reduce( (x, swap_data) => {
            return this.calculateSingleSwapOutput(x, swap_data);
        }, input_amount);
        
        return output_amount;
    }

    priceImpactCorrectionMultiplier(input_amount, r0) {
        return 1 / (1 + (input_amount/r0));
    }

    calculateOptimalSwapSequenceParams(swap_sequence) {
        // TODO: calculate ranges with respect to liquidity or at least decimals
        let compute_range = math.range(0.00001, 10000, 0.5)._data;
        
        // compute swap output space
        let swap_profits = compute_range.map( x => this.calculateSwapSequenceOutput(x, swap_sequence) - x );

        try {
            // argmax for getting best input
            let max_idx = math.max(swap_profits)._data[0];

            let x_max = compute_range[max_idx];
            let y_max = swap_profits[max_idx];
            
            let res = [x_max, y_max];
            Logger.error(res);
            return res;
        } catch (e) {
            return [0, -1]; // impossible to achieve profit?
        }
    }

    calculateLinearSwapQByReserves(r0: number, r1: number, fee_prop: number) {
        const e =  1.0e6;
        let fee_k = 1.0 - (fee_prop / e);

        if ( (r0 <= 0 || r1 <= 0) || !(!!r0 && !!r1)) { // invalid data fallback
            return null;
        }

        let q = r1 / r0;
        return q * fee_k;
    }

    convertReserves(p: PoolRawDataPacket, token_object_dict: {[address:string]: Token }) {
        return {
            r0: this.calculateAmount(token_object_dict[p.token0_address], p.token0_reserve),
            r1: this.calculateAmount(token_object_dict[p.token1_address], p.token1_reserve)
        };
    }

    calculateSwapLogWeight(w: number) {
        return -Math.log(w);
    }

    calculateAmount(token_obj, amount: BigintIsh): number {
        let token_amount: TokenAmount;
        try {
            token_amount = new TokenAmount(token_obj, amount);
        } catch (e) { 
            return 0.0;
        }
        const amount_str = token_amount.toExact();
        return parseFloat(amount_str);
    }
}
