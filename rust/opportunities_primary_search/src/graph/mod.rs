
use petgraph::visit::{IntoEdges, IntoNodeIdentifiers, NodeCount, NodeIndexable, VisitMap, Visitable};
use petgraph::prelude::*;
use petgraph::algo::FloatMeasure;

pub(crate) mod model;
use crate::graph::model::{Path, EdgePath};


// bellman-fold 1st step from petgraph (private crate fn)
fn bellman_ford_initialize_relax<G>(
    g: G,
    source: G::NodeId,
) -> (Vec<G::EdgeWeight>, Vec<Option<G::NodeId>>, Vec<Option<G::EdgeId>>)
where
    G: NodeCount + IntoNodeIdentifiers + IntoEdges + NodeIndexable,
    G::EdgeWeight: FloatMeasure,
{
    // Step 1: initialize graph
    let mut predecessor = vec![None; g.node_bound()];
    let mut predecessor_edge = vec![None; g.node_bound()];
    let mut distance = vec![<_>::infinite(); g.node_bound()];
    let ix = |i| g.to_index(i);
    distance[ix(source)] = <_>::zero();

    // Step 2: relax edges repeatedly
    for _ in 1..g.node_count() {
        let mut did_update = false;
        for i in g.node_identifiers() {
            for edge in g.edges(i) {
                let j = edge.target();
                let w = *edge.weight();
                if distance[ix(i)] + w < distance[ix(j)] {
                    distance[ix(j)] = distance[ix(i)] + w;
                    predecessor[ix(j)] = Some(i);
                    predecessor_edge[ix(j)] = Some(edge.id());
                    did_update = true;
                }
            }
        }
        if !did_update {
            break;
        }
    }
    (distance, predecessor, predecessor_edge)
}


pub fn find_negative_cycles<G>(g: G, source: G::NodeId) 
    -> Option<(Vec<Path<G>>, Vec<EdgePath<G>>)>
where
    G: NodeCount + IntoNodeIdentifiers + IntoEdges + NodeIndexable + Visitable,
    G::EdgeWeight: FloatMeasure,
{
    let ix = |i| g.to_index(i);
    let mut paths = Vec::<Path<G>>::new();
    let mut edge_paths = Vec::<EdgePath<G>>::new();
    // Step 1: initialize and relax
    let (distance,
         predecessor,
         predecessor_edge) = bellman_ford_initialize_relax(g, source);

    // Step 2: Check for negative weight cycle
    //'outer: 
    for i in g.node_identifiers() {
        for edge in g.edges(i) {
            let j = edge.target();
            let w = *edge.weight();
            if distance[ix(i)] + w < distance[ix(j)] {
                // Step 3: negative cycle found
                let start = j;
                let mut node = start;
                let mut visited = g.visit_map();

                let mut path = Vec::<G::NodeId>::new();
                let mut edge_path = Vec::<G::EdgeId>::new();

                path.push(start);
                //edge_path.push(edge.id());

                // Go backward in the predecessor chain
                loop {
                    let ancestor;
                    let ancestor_edge;
                    match predecessor[ix(node)] {
                        Some(predecessor_node) => { 
                            ancestor = predecessor_node;
                            ancestor_edge = predecessor_edge[ix(node)].expect("быть такого не должно");
                        },
                        None => { // no predecessor, self cycle
                            ancestor = node;
                            ancestor_edge = edge.id(); // todo: ИСПРАВИТЬ, ЭТО АБСОЛЮТНО НЕВЕРНО, НО СИТУАЦИИ ТАКОЙ БЫТЬ НЕ ДОЛЖНО
                        } 
                    };
                    // We have only 2 ways to find the cycle and break the loop:
                    // 1. start is reached
                    if ancestor == start {
                        path.push(ancestor);
                        edge_path.push(ancestor_edge);
                        break;
                    }

                    // 2. some node was reached twice
                    else if visited.is_visited(&ancestor) {
                        path.push(ancestor);
                        edge_path.push(ancestor_edge);
                        
                        // Drop any node in path that is before the first ancestor
                        let pos = path
                            .iter()
                            .position(|&p| p == ancestor)
                            .expect("we should always have a position");

                        path = path[pos..path.len()].to_vec();
                        edge_path = edge_path[pos..edge_path.len()].to_vec();

                        break;
                    }

                    // None of the above, some middle path node
                    path.push(ancestor);
                    edge_path.push(ancestor_edge);
                    visited.visit(ancestor);
                    node = ancestor;
                    
                }
                
                if !path.is_empty() && !edge_path.is_empty() {
                    edge_path.reverse();
                    path.reverse();

                    paths.push(path);
                    edge_paths.push(edge_path);
                }
            }
        }
    }

    if !paths.is_empty() && !edge_paths.is_empty() {
        Some((paths, edge_paths))
    } else {
        None
    }
}
