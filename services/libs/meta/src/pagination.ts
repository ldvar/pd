
import { PoolMetadata } from "apps/pools/src/models/pool";

const pools_fetch_events = {
    finished: "pagination.finished",
    page_loaded: "pagination.page_loaded",
}

export class PageLoadedEvent {
    static pattern: string = pools_fetch_events.page_loaded;

    public page: number;
    public data: PoolMetadata[];
    public rest: number;

    public get_next_callback: Function;
    public finish_callback: Function;
    
    constructor(page: number, data: PoolMetadata[], rest: number,
         get_next_callback: Function,
         finish_callback: Function) {
        this.page = page;
        this.data = data;
        this.rest = rest;
        this.get_next_callback = get_next_callback;
        this.finish_callback = finish_callback;
    }
} 

export class FetchFinishedEvent {
    static pattern: string = pools_fetch_events.finished;
}
