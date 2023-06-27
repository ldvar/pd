
import { Controller, Inject, LogLevel, Logger } from "@nestjs/common";
Logger.overrideLogger(["log"] as LogLevel[]);

import {
  MessagePattern,
  ClientKafka,
  Payload,
} from "@nestjs/microservices";

import { ConfigService } from "@nestjs/config";

import { patterns, pageLimit } from '@positivedelta/meta/config';
import { DataPage } from '@positivedelta/meta/models/interactions';
import { PoolMetadata } from "@positivedelta/apps/pools/models/pool";
import { TokensData } from "@positivedelta/apps/pools/models/token";
import { PoolsService } from "@positivedelta/apps/pools/pools.service";


@Controller()
export class PoolsController {
  constructor(
    private readonly poolsService: PoolsService,
    @Inject("POOLS_SERVICE") private client: ClientKafka,
    private readonly configService: ConfigService,
  ) {}

  @MessagePattern(patterns.get_pools)
  async getPoolsForFetch(
    @Payload() data: any,
  ): Promise<DataPage<PoolMetadata[]>>
  {
    let page = data["page"];
    let offset: number = page * pageLimit;

    let result = await this.poolsService.getPoolsForCheck();
    let slice = result.slice(offset, offset + pageLimit);

    let out = {};
    out["data"] = slice;
    out["rest"] = result.length - offset - pageLimit;
    return out as DataPage<PoolMetadata[]>;
  }

  @MessagePattern(patterns.get_tokens)
  async getTokensData(
    @Payload() data: any,
  ) {
    let page = data["page"];
    let offset: number = page * pageLimit;

    let result = await this.poolsService.getTokensData();

    let keys = Object.getOwnPropertyNames(result);
    let slice = Object.fromEntries(keys.slice(offset, offset + pageLimit).map(addr => [addr, result[addr]])); // fix pagination

    let out = {};
    out["data"] = slice;
    out["rest"] = keys.length - offset - pageLimit;

    return out as DataPage<TokensData>;
  }
}
