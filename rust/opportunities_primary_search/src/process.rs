
use petgraph::{Graph, Directed};
use petgraph::prelude::*;

use crate::graph::find_negative_cycles;
use crate::model::{PoolsDataPacket, PoolData};


pub fn build_graph_from_pools(pools_data: Vec<PoolData>) -> Graph<(), f32, Directed> {
    let graph = Graph::<(), f32, Directed>::from_edges(
        pools_data
            .iter().map( |pool| {
                (NodeIndex::new(pool.token0_id), NodeIndex::new(pool.token1_id), pool.weight)
        }
    ));

    graph
}

pub fn search_paths_in_data_packet(data_packet: PoolsDataPacket) -> Option<(Vec<Vec<usize>>, Vec<Vec<usize>>)>
{
    let pools = data_packet.pools_data;

    let graph = build_graph_from_pools(pools);
    let negative_cycles_search_result = find_negative_cycles(&graph, NodeIndex::new(0))
        .and_then(|(paths, edge_paths)| {
            Some((
                paths.iter().map(|path| {
                    path.iter().map(|node_id| node_id.index()).collect()
                }).collect(),
                edge_paths.iter().map(|path| {
                    path.iter().map(|edge_id| edge_id.index()).collect()
                }).collect()
            )) 
        });

    return negative_cycles_search_result;
} 
