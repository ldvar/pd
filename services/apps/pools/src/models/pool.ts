
export enum PoolType {
    UniswapV2,
    UniswapV3,
}

export abstract class Pool {
    public address: String;
    public type: PoolType;
}
