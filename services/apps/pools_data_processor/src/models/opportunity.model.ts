
export class Hop {
    public protocol: number;
    public data: string;
    public path: string[];
}
export class Route {
    public hops: Hop[];
    public part: number;
}

export class FlashSwapParams {
    public pool_address: string;
    public amount: number;
    public routes: Route[];
}

// slightly abundant representation for easy processing
export class HotOpportunity {
    public input_token: string;
    public best_input: number;
    public expected_profit: number;

    public swap_data: FlashSwapParams;
}

