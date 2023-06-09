
import { PoolRawDataPacket } from "@positivedelta/meta/models/pools_raw_data_packet";
//import { PoolMetadata } from "apps/pools/src/models/pool";


export class PoolProcessedMetadata {
    public metadata: PoolRawDataPacket;

    public weight: number;

    public token0_reserve: number;
    public token1_reserve: number;   
}
