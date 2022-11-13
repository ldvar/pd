
import { Injectable } from '@nestjs/common';

import { PoolsRawDataPacket } from '@positivedelta/meta/models/pools_raw_data_packet';


@Injectable()
export class PoolsDataProcessorService {
  processRawDataPacket(data_packet: PoolsRawDataPacket) {
    
  }

  calculateSwapWeight(pool_data) {
    
  }
}
