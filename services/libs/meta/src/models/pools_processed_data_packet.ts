
/* 
pub struct PoolData {
    pub id: usize,
    pub token0_id: usize,
    pub token1_id: usize,
    pub weight: f32,
}
*/

export class PoolProcessedDataPacket {
    public id: number;

    public token0_id: number;
    public token1_id: number;
    
    public weight: number;
}

export class PoolsProcessedDataPacket {
    pools_data: PoolProcessedDataPacket[];
}
