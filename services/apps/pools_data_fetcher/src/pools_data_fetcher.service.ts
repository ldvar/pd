import { Injectable } from '@nestjs/common';

@Injectable()
export class PoolsDataFetcherService {
  getHello(): string {
    return 'Hello World!';
  }
}
