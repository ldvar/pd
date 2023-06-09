import { Controller, Inject, LogLevel, Logger } from "@nestjs/common";
Logger.overrideLogger(["log"] as LogLevel[]);

import {
  MessagePattern,
  ClientKafka,
  EventPattern,
  Payload,
} from "@nestjs/microservices";

import { ConfigService } from "@nestjs/config";

import { PoolMetadata } from "./models/pool";
import { PoolsService } from "./pools.service";

import { TokensData } from "./models/token";

import { patterns, pageLimit } from '@positivedelta/meta/config';
import { DataPage } from '@positivedelta/meta/models/interactions';


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
  ) /**//**/ {
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
