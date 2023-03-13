
export const token_symbols = [
  'WMATIC',
  'WBTC',
  'WETH',
  'DAI',
  'USDT',
  'USDC',
  'BUSD',
  'AAVE',
  'COMP',
  'MANA',
  'GRT',
  'CRV',
  'GALA',
  'BEL',
  'CRV',
  'SUSHI',
  'OCEAN',
  'MASK',
  'GHST',
  'UMA',
  'ANKR',
  'FRAX',
  'TWT',
  'REP',
  'BAND',
  'WOO',
  'PLA',
  'INJ',
  'GLM',
  'ELON',
  'RNDR',
  'SUPER',
  'ALPACA',
  'ARK',
  'QUICK',
  'API3',
];

// pool_type : address
export const factories = {
  UniswapV3: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  UniswapV2: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
};

export const chainId = 137; //56; // bsc //137; // polygon

export const ammTypes = [ "uniswap_v2" ];//, 'uniswap_v3' ];

// event and message patterns
export const patterns = {
  get_pools: "pools.get_pools",

  get_tokens: "tokens.get_metadata",
  get_tokens_by_addresses: "tokens.get_metadata_by_addresses",

  pools_raw_data: "pools.datastream.raw",
  pools_processed_data: "pools.datastream.processed",
  
};

export const pageLimit: number = 100;
