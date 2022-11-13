
import { Injectable } from "@nestjs/common";
import { Factory } from "../models/factory";
import { PoolType } from "../models/pool"

@Injectable()
export class FactoryService {

    getPoolAdresses(factory: Factory) {
        switch (factory.poolType) {
            case PoolType.UniswapV2: {
                
                break;
            }
            case PoolType.UniswapV3: {

                break;
            }
        }
    }

    
}
