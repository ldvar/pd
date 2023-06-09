export enum PoolType {
  UniswapV2,
  UniswapV3,
}

export class PoolMetadata {
  public type: PoolType;

  public address: string;

  public token0_address: string;
  public token1_address: string;

  public id?: number;
}
