
// dodoex on polygon died already while this bot was slowly built...
export const dodoFlashswapAmmPools = {
  USDT: "0x813fddeccd0401c4fa73b092b074802440544e52",
  WMATIC: "0x4b658c395804f90d76aa1995391e4730c7208de7",
  USDC: "0x813fddeccd0401c4fa73b092b074802440544e52",
};

//export const chainId =    42161; //56; // bsc //137; // polygon

export const chainId = 42161; //56; // bsc //137; // polygon

// event and message patterns
export const patterns = {
  get_pools: "pools.get_pools",

  get_tokens: "tokens.get_metadata",
  get_tokens_by_addresses: "tokens.get_metadata_by_addresses",

  pools_raw_data: "pools.datastream.raw",
  pools_processed_data: "pools.datastream.processed",
  
  pools_get_latest_graph: "pools.graph.get_latest",
  pools_latest_graph: "pools.graph.latest_requested",

  opportunities_primary_found: "opportunities.primary_search.found", // repeat in file "config.rs" in rust service
  opportunities_realtime: "opportunities.realtime",
};

export const ammTypes = [ 
  "uniswap_v2",
  "uniswap_v3"
];

// TODO: move closure contract method calls here aswell
export const onchain_fetch_config = { 
  abi_functions_patterns: {
    uniswap_v2: [ 
      "getReserves", 
    ],

    uniswap_v3: [ 
      "slot0" , 
      "liquidity",
    ],
  },
}

export const pools_config = {
  data_fetch: {
    delay: 5000,
    multicall_size_limit: 200, // TODO: implement independently multicall splitting and pool database truncate
  },

  metadata_fetch_pools_number_limit: 500,
}

export const debug_config = {
  dex_guru_no_retry: true, // not implemented
}

export const pageLimit: number = 100;
