
import { Controller, Inject, Logger } from '@nestjs/common';

import { ClientKafka } from '@nestjs/microservices';

import { Observable, firstValueFrom, interval, repeat } from 'rxjs';
import { OnEvent, EventEmitter2} from '@nestjs/event-emitter';

import { ConfigService } from "@nestjs/config";

import { PoolMetadata } from 'apps/pools/src/models/pool';

import { patterns, pools_config } from '@positivedelta/meta/config';
import { DataPage } from '@positivedelta/meta/models/interactions';
import { PageLoadedEvent, FetchFinishedEvent } from '@positivedelta/meta/pagination'

import { PoolsDataFetcherService } from './pools_data_fetcher.service';


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

    setPools(pools: PoolMetadata[]) {
        this.check_pools = pools;
    }

    addPools(pools: PoolMetadata[]) {
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
        Logger.log("loading/waiting for pools metadata page...");

        let callback = (page, data, rest) => this.eventEmitter.emit(PageLoadedEvent.pattern, 
            new PageLoadedEvent(page, data, rest,
                p => { this.getPoolsPage(p+1); } ,
                _ => { this.publishFinished(); },
                d => { this.addPools(d); }) 
        );

        await firstValueFrom(this.getPoolsPageObservable(page)).then(data => {
            callback(page, data.data, data.rest);

            Logger.log("pools metadata page loaded");
        }).catch( (err) => {
            Logger.error("Failed loading pools metadata page: ");
            Logger.error(err);
        });
    }

    ///

    @OnEvent(PageLoadedEvent.pattern, {objectify: true, "async": false})
    async handlePageLoaded(payload: PageLoadedEvent) {
        await payload.update_data_callback(payload.data);

        if (payload.data.length == 0 || payload.rest <= 0) {
            Logger.log("finished fetching pool metadata");
            payload.finish_callback();
        }
        else {
            Logger.log("trying to start next page loading");
            payload.get_next_callback(payload.page);
        }
    }

    @OnEvent(FetchFinishedEvent.pattern, {objectify: true, "async": false})
    async handleLoadFinish(oayload: FetchFinishedEvent) {
        // TODO make it two different variables
        let pools_number_limit = pools_config.data_fetch.multicall_size_limit
        if (pools_number_limit < this.check_pools.length) {
            this.setPools(this.check_pools.slice(0, pools_number_limit));
        }
    }

    ///

    async mainLoop() {
        const source = interval(pools_config.data_fetch.delay);
        source.pipe(repeat()).subscribe( async _ => {
            let dataPacket = await this.poolsDataFetcherService.fetchDataPacket(this.check_pools);

            this.client.emit(patterns.pools_raw_data, JSON.stringify(dataPacket));
        });
    }
}
