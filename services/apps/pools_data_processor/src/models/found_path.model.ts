
// same object model as in model.rs

export type FoundPathsRawDataPacket = number[][][];

export class FoundPathsDataPacket {
    public node_paths: number[][];
    public edge_paths: number[][];

    constructor(packet: FoundPathsRawDataPacket) {
        this.node_paths = packet[0];
        this.edge_paths = packet[1];
    }
}
