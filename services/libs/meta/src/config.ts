
export const dodoFlashswapAmmPools = {
  WETH: "0x5333Eb1E32522F1893B7C9feA3c263807A02d561",
  WMATIC: "0x10Dd6d8A29D489BEDE472CC1b22dc695c144c5c7",
  USDC: "0x10Dd6d8A29D489BEDE472CC1b22dc695c144c5c7",
};

//export const chainId =    42161; //56; // bsc //137; // polygon

export const chainId = 137; //56; // bsc //137; // polygon

export const ammTypes = [ "uniswap_v2" ]; //, 'uniswap_v3' ];

// event and message patterns
export const patterns = {
  get_pools: "pools.get_pools",

  get_tokens: "tokens.get_metadata",
  get_tokens_by_addresses: "tokens.get_metadata_by_addresses",

  pools_raw_data: "pools.datastream.raw",
  pools_processed_data: "pools.datastream.processed",
  
  pools_get_latest_graph: "pools.graph.get_latest",
  pools_latest_graph: "pools.graph.latest_requested",

  opportunities_primary_found: "opportunities.primary_search.found", // repeat in file "config.rs"
  opportunities_realtime: "opportunities.realtime",
};

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
    multicall_size_limit: 10000, // TODO: implement independently multicall splitting and pool database truncate
  },

  metadata_fetch_pools_number_limit: 500,
}

export const debug_config = {
  dex_guru_no_retry: true,
}

export const pageLimit: number = 100;
