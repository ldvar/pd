import { Injectable } from '@nestjs/common';

import { Factory } from '@positivedelta/apps/pools/models/factory';
import { PoolType } from '@positivedelta/apps/pools/models/pool';

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
