
import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';

import { Observable } from 'rxjs';

import { PoolsDataProcessorService } from './pools_data_processor.service';
import { TokenMetadata, TokensData } from 'apps/pools/src/models/token';

import { PoolsRawDataPacket } from '@positivedelta/meta/models/pools_raw_data_packet';
import { patterns } from "@positivedelta/meta/config";

import { PageLoadedEvent, FetchFinishedEvent } from '@positivedelta/meta/pagination';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DataPage } from '@positivedelta/meta/models/interactions';


@Controller()
export class PoolsDataProcessorController {
  tokens_data: TokensData;

  constructor(
    private eventEmitter: EventEmitter2,
    private readonly poolsDataProcessorService: PoolsDataProcessorService,
    @Inject('POOLS_DATA_PROCESSOR_SERVICE') private client: ClientKafka,
    ) {}
    
    ///
    
    async onModuleInit() {
      this.client.subscribeToResponseOf(patterns.get_tokens);
      await this.client.connect();
      
      await this.getTokens();
      await this.eventEmitter.waitFor(FetchFinishedEvent.pattern, 30000);
        
      this.poolsDataProcessorService.updateTokensData(this.tokens_data)
    }
    
    async initListeners() {
      this.eventEmitter.addListener(PageLoadedEvent.pattern, this.handlePageLoaded);
    }
    
    ///
    
    
    setTokens(tokens) {
      this.tokens_data = tokens;
    }
    
    async addTokens(tokens) {
      this.tokens_data = { ...this.tokens_data, ...tokens};
      Logger.error("test dict contatenation", this.tokens_data);
    }
    
    async getTokens() {
      await this.initListeners();
      this.getTokensPage(0);
    }

    ///

    getTokensPageObservable(page: number): Observable<DataPage<TokensData>> {
      return this.client.send(patterns.get_tokens, { page: page });
  }

    publishFinished() {
        this.eventEmitter.emit(FetchFinishedEvent.pattern, new FetchFinishedEvent());
    }

    async getTokensPage(page: number) {
      Logger.error("loading page");

      let callback = (page, data, rest) => this.eventEmitter.emit(PageLoadedEvent.pattern, 
          new PageLoadedEvent(page, data, rest,
               (p) => this.getTokensPage(p+1),
                _ => { this.publishFinished(); }));
      
      await this.getTokensPageObservable(page).forEach( data => {
          callback(page, data.data, data.rest);
          Logger.error("page loaded");
      });
  }

    ///

    @OnEvent(PageLoadedEvent.pattern, {objectify: true, "async": false})
    async handlePageLoaded(payload: PageLoadedEvent) {
        //Logger.error("listener matched page loaded event");
        //Logger.error(page, data, rest);

        Logger.error(JSON.stringify(payload));

        if (payload.data.length == 0 || payload.rest <= 0) {
            Logger.error("finished fetching tokens");
            payload.finish_callback();
        }
        else {
            Logger.error("trying to get start next page loading");
            payload.get_next_callback(payload.page + 1);
        }
    }
    
    /*
    getTokensData(): Observable<{ [address: string]: TokenMetadata }> {
      return this.client.send(patterns.get_tokens, {});
    }
    */
    
    @EventPattern(patterns.pools_raw_data)
    async processDataPacket(@Payload() data_packet: PoolsRawDataPacket) {
      let processed_packet = this.poolsDataProcessorService.processRawDataPacket(data_packet);
      this.client.emit(patterns.pools_processed_data, JSON.stringify(processed_packet));
    }
  }
  