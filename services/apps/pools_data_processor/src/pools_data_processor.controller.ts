import { Controller, Inject, Logger } from "@nestjs/common";
import { ClientKafka, EventPattern, Payload } from "@nestjs/microservices";

import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

import { Observable } from "rxjs";

import { TokenMetadata, TokensData } from "apps/pools/src/models/token";

import { PoolsRawDataPacket } from "@positivedelta/meta/models/pools_raw_data_packet";
import { patterns } from "@positivedelta/meta/config";
import { PageLoadedEvent, FetchFinishedEvent } from "@positivedelta/meta/pagination";
import { DataPage } from "@positivedelta/meta/models/interactions";

import { PoolsDataProcessorService } from "./pools_data_processor.service";
import { FoundPathsDataPacket } from "./models/found_path.model";


@Controller()
export class PoolsDataProcessorController {
    tokens_data: TokensData = {};

    constructor(
        private eventEmitter: EventEmitter2,
        private poolsDataProcessorService: PoolsDataProcessorService,
        @Inject("POOLS_DATA_PROCESSOR_SERVICE") private client: ClientKafka,
    ) {}

    ///

    async onModuleInit() {
        this.client.subscribeToResponseOf(patterns.get_tokens);
        await this.client.connect();

        await this.getTokens();
        await this.eventEmitter.waitFor(FetchFinishedEvent.pattern);

        this.poolsDataProcessorService.updateTokensData(this.tokens_data);
    }

    async initListeners() {
        this.eventEmitter.addListener(
            PageLoadedEvent.pattern,
            this.handlePageLoaded,
        );
    }

    setTokens(tokens) {
        this.tokens_data = tokens;
    }

    addTokens(tokens) {
        this.tokens_data = { ...this.tokens_data, ...tokens };
        //Logger.error("test dict contatenation", this.tokens_data);
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
        this.eventEmitter.emit(
            FetchFinishedEvent.pattern,
            new FetchFinishedEvent(),
        );
    }

    async getTokensPage(page: number) {
        Logger.error("loading/waiting for tokens metadata page from pools service");

        const callback = (page, data, rest) =>
            this.eventEmitter.emit(
                PageLoadedEvent.pattern,
                new PageLoadedEvent(
                    page, data, rest,
                    (p) => { this.getTokensPage(p + 1); },
                    _ => { this.publishFinished(); },
                    d => { this.addTokens(d); },
                ),
        );

        await this.getTokensPageObservable(page).forEach(data => {
            callback(page, data.data, data.rest);
            Logger.error("page loaded");
        });
    }

    ///

    @OnEvent(PageLoadedEvent.pattern, { objectify: true, async: false })
    async handlePageLoaded(payload: PageLoadedEvent) {
        await payload.update_data_callback(payload.data);

        if (payload.data.length == 0 || payload.rest <= 0) {
            Logger.error("finished fetching tokens");
            await payload.finish_callback();
        }
        else {
            Logger.error("trying to get start next page loading");
            await payload.get_next_callback(payload.page);
        }
    }

    /*
    getTokensData(): Observable<{ [address: string]: TokenMetadata }> {
      return this.client.send(patterns.get_tokens, {});
    }
    */

    @EventPattern(patterns.pools_raw_data)
    async processDataPacket(@Payload() data_packet: PoolsRawDataPacket) {
        const processed_packet = this.poolsDataProcessorService.processRawDataPacket(data_packet);
        this.client.emit(
            patterns.pools_processed_data,
            JSON.stringify(processed_packet),
        );
    }

    ///

    @EventPattern(patterns.pools_get_latest_graph)
    async getLatestGraph() {
        const latest_graph_packet = this.poolsDataProcessorService.getLatestGraph();
        this.client.emit(
            patterns.pools_latest_graph,
            JSON.stringify(latest_graph_packet),
        );
    }

    ///

    @EventPattern(patterns.opportunities_primary_found)
    async handleFoundOpportunitiesDataPacket(
        @Payload() data_packet: FoundPathsDataPacket,
    ) {
        //let pools_processing_cache = this.poolsDataProcessorService.pools_state_cache;

        let hot_opportunities = this.poolsDataProcessorService.processRawOpportunitiesData(data_packet);
        
        this.client.emit(
            patterns.opportunities_realtime,
            JSON.stringify(hot_opportunities),
        );
    }

}
