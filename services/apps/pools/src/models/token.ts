
export class TokenMetadata {
  public symbol: string;
  public address: string;

  public decimals: number;

  public id?: number;
}

export type TokensData = { [address: string]: TokenMetadata };
