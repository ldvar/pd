
import { Controller, Inject, Logger } from "@nestjs/common";

import { ClientKafka, EventPattern, Payload } from "@nestjs/microservices";

import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

import { toQuantity } from "ethers";

import { Observable } from "rxjs";

import { TokensData } from "apps/pools/src/models/token";

import { PoolsRawDataPacket } from "@positivedelta/meta/models/pools_raw_data_packet";
import { patterns } from "@positivedelta/meta/config";
import { PageLoadedEvent, FetchFinishedEvent } from "@positivedelta/meta/pagination";
import { DataPage } from "@positivedelta/meta/models/interactions";

import { PoolsDataProcessorService } from "./pools_data_processor.service";
import { FoundPathsDataPacket, FoundPathsRawDataPacket } from "./models/found_path.model";
import { Hop, HotOpportunity, Route } from "./models/opportunity.model";


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

    addTokens(tokens: TokensData) {
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
        @Payload() raw_data_packet: FoundPathsRawDataPacket,
    ) {
        let data_packet = new FoundPathsDataPacket(raw_data_packet);
        let hot_opportunities = this.poolsDataProcessorService.processRawOpportunitiesData(data_packet);
        
        this.client.emit(
            patterns.opportunities_realtime,
            JSON.stringify(hot_opportunities),
        );
    }

    /// a handler for contract interaction debugging
    @EventPattern("testOpp")
    async testOpp() {
        let t = new HotOpportunity();
        let ts = ["USDC", "USDT"];

        const ts_addr = (n: number) => {
            return this.poolsDataProcessorService.tokenFromSymbol(ts[n]).address;
        };
        const hop = (i: number, o:number) => { 
            let h = new Hop();

            h.path = [ ts_addr(i), ts_addr(o) ];
            h.data = (i == 0) ? "0x20bf018fddba3b352f3d913fe1c81b846fe0f490" : "0x2cf7252e74036d1da831d11089d326296e64a728" ;
            h.protocol = 0;
            return h;
        };

        t.input_token = ts_addr(0);
        let decimals = this.poolsDataProcessorService.tokenFromSymbol(ts[0]).decimals
        let multiplier = BigInt(1);
        for (let i = 0; i < decimals; i++) {
            multiplier *= BigInt(10);
        };

        t.best_input = toQuantity(BigInt(3) * multiplier);
        t.expected_profit = 0.1;

        let route = new Route();
        route.part = 10000;  // total must be 10000
        route.hops = [ hop(0, 1), hop(1, 0) ];

        t.swap_data = this.poolsDataProcessorService.getFlashSwapParams(
            t.input_token, 
            t.best_input, 
            [route]
        );
        
        let testData = JSON.stringify([t]);
        this.client.emit(patterns.opportunities_realtime, testData);
    }
}
