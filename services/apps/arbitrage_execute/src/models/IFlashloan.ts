
import { Hop, Route } from "apps/pools_data_processor/src/models/opportunity.model"

export class FlashParams {
    flashLoanPool: string;
    loanAmount: BigInt;
    routes: Route[];
}

export interface IFlashloan {
    dodoFlashLoan(params: FlashParams);
}

