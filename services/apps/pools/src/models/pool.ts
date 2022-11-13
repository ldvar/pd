
export enum PoolType {
    UniswapV2,
    UniswapV3,
}

export abstract class Pool {
    public type: PoolType;

    public address: string;

    public token0_address: string;
    public token1_address: string;

    public token0_reserve: bigint;
    public token1_reserve: bigint;

    public fee: number;

    public id: bigint;
}

