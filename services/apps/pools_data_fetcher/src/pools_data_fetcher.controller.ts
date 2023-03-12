
import { Controller, Inject, Logger } from '@nestjs/common';

import {
  ClientKafka,
//  MessagePattern,
//  Payload,
//  ServerKafka,
} from '@nestjs/microservices';

import { Observable, interval, repeat } from 'rxjs';
import { OnEvent, EventEmitter2} from '@nestjs/event-emitter';

import { ConfigService } from "@nestjs/config";

import { PoolsDataFetcherService } from './pools_data_fetcher.service';
import { PoolMetadata } from 'apps/pools/src/models/pool';

import { patterns } from '@positivedelta/meta/config';

import { DataPage } from '@positivedelta/meta/models/interactions';

import { PageLoadedEvent, FetchFinishedEvent } from '@positivedelta/meta/pagination'


@Controller()
export class PoolsDataFetcherController {
    check_pools: PoolMetadata[] = [];

    constructor(
        private eventEmitter: EventEmitter2,
        private poolsDataFetcherService: PoolsDataFetcherService,
        @Inject(ConfigService) private configService: ConfigService,
        @Inject('POOLS_DATA_FETCHER_SERVICE') private client: ClientKafka,
    ) {}

    async onModuleInit() {
        this.client.subscribeToResponseOf(patterns.get_pools);
        await this.client.connect();

        await this.getPools();
        await this.eventEmitter.waitFor(FetchFinishedEvent.pattern);
        await this.mainLoop();
    }

    async initListeners() {
        this.eventEmitter.addListener(PageLoadedEvent.pattern, this.handlePageLoaded);
    }

    ///

    setPools(pools) {
        this.check_pools = pools;
    }

    addPools(pools) {
        this.check_pools = this.check_pools.concat(pools);
    }

    async getPools() {
        await this.initListeners();
        this.getPoolsPage(0);
    }

    ///

    getPoolsPageObservable(page: number): Observable<DataPage<PoolMetadata[]>> {
        return this.client.send(patterns.get_pools, { page: page });
    }

    publishFinished() {
        this.eventEmitter.emit(FetchFinishedEvent.pattern, new FetchFinishedEvent());
    }

    async getPoolsPage(page: number) {
        Logger.error("loading page");

        let callback = (page, data, rest) => this.eventEmitter.emit(PageLoadedEvent.pattern, 
            new PageLoadedEvent(page, data, rest,
                p => this.getPoolsPage(p+1),
                _ => { this.publishFinished(); },
                d => { this.addPools(d); }) );
        
        await this.getPoolsPageObservable(page).forEach( data => {
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

        payload.update_data_callback(payload.data);

        if (payload.data.length == 0 || payload.rest <= 0) {
            Logger.error("finished fetching pools");
            payload.finish_callback();
        }
        else {
            Logger.error("trying to start next page loading");
            payload.get_next_callback(payload.page + 1);
        }
    }

    ///

    async mainLoop() {
        const source = interval(2000);
        
        source.pipe(repeat()).subscribe( async _ => {
        let dataPacket = await this.poolsDataFetcherService.fetchDataPacket(this.check_pools);

        this.client.emit(patterns.pools_raw_data, JSON.stringify(dataPacket));
        });
    }
}
