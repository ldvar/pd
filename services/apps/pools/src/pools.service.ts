import { Injectable } from '@nestjs/common';

@Injectable()
export class PoolsService {
  getHello(): string {
    return 'Hello World!';
  }
}
