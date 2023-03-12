
/*
pub struct PoolData {
    pub id: usize,
    pub token0_id: usize,
    pub token1_id: usize,
    pub weight: f32,
}
*/

export class PoolRawDataPacket {
    public type: number;
    public address: string;

    public token0_address: string;
    public token1_address: string;

    public token0_reserve: string;
    public token1_reserve: string;

    public fee: number;
}

export class PoolsRawDataPacket {
    public pools_data: PoolRawDataPacket[];
}
