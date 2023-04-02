


import { BINANCE_NETWORK, POLYGON_NETWORK, ARBITRUM_NETWORK } from 'nestjs-ethers';

import { chainId } from './config';


export const ethers_chainId = ( () => {
    switch(chainId.toString()) {
        case "56":
            return BINANCE_NETWORK;
        case "137":
            return POLYGON_NETWORK;
        case "42161":
            return ARBITRUM_NETWORK;
    };
} )()

///

export const eventEmitterConfig = {
    "verboseMemoryLeak": true,
    "wildcard": true,
    "maxListeners": 100,
    "global": true,
    ignoreErrors: false,
};

///

export const ethersConfig = {
    network: ethers_chainId,
    custom: { url: "https://rpc.ankr.com/bsc" },
    useDefaultProvider: false,
}
