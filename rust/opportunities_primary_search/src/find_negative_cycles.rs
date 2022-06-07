
use petgraph::visit::{IntoEdges, IntoNodeIdentifiers, NodeCount, NodeIndexable, VisitMap, Visitable, GraphBase};
use petgraph::prelude::*;
use petgraph::algo::FloatMeasure;


type Path<G> = Vec<<G as GraphBase>::NodeId>;


// bellman-fold 1st step from petgraph (private crate fn)
fn bellman_ford_initialize_relax<G>(
    g: G,
    source: G::NodeId,
) -> (Vec<G::EdgeWeight>, Vec<Option<G::NodeId>>)
where
    G: NodeCount + IntoNodeIdentifiers + IntoEdges + NodeIndexable,
    G::EdgeWeight: FloatMeasure,
{
    // Step 1: initialize graph
    let mut predecessor = vec![None; g.node_bound()];
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
                    did_update = true;
                }
            }
        }
        if !did_update {
            break;
        }
    }
    (distance, predecessor)
}


pub fn find_negative_cycles<G>(g: G, source: G::NodeId) -> Option<Vec<Path<G>>>
where
    G: NodeCount + IntoNodeIdentifiers + IntoEdges + NodeIndexable + Visitable,
    G::EdgeWeight: FloatMeasure,
{
    let ix = |i| g.to_index(i);
    let mut paths = Vec::<Path<G>>::new();

    // Step 1: initialize and relax
    let (distance, predecessor) = bellman_ford_initialize_relax(g, source);

    // Step 2: Check for negative weight cycle
    'outer: for i in g.node_identifiers() {
        for edge in g.edges(i) {
            let j = edge.target();
            let w = *edge.weight();
            if distance[ix(i)] + w < distance[ix(j)] {
                // Step 3: negative cycle found
                let start = j;
                let mut node = start;
                let mut visited = g.visit_map();

                let mut path = Vec::<G::NodeId>::new();

                // Go backward in the predecessor chain
                loop {
                    let ancestor = match predecessor[ix(node)] {
                        Some(predecessor_node) => predecessor_node,
                        None => node, // no predecessor, self cycle
                    };
                    // We have only 2 ways to find the cycle and break the loop:
                    // 1. start is reached
                    if ancestor == start {
                        path.push(ancestor);
                        break;
                    }
                    // 2. some node was reached twice
                    else if visited.is_visited(&ancestor) {
                        // Drop any node in path that is before the first ancestor
                        let pos = path
                            .iter()
                            .position(|&p| p == ancestor)
                            .expect("we should always have a position");
                        path = path[pos..path.len()].to_vec();

                        break;
                    }

                    // None of the above, some middle path node
                    path.push(ancestor);
                    visited.visit(ancestor);
                    node = ancestor;
                }
                // We are done here
                // break 'outer;
                
                if !path.is_empty() {
                    // Users will probably need to follow the path of the negative cycle
                    // so it should be in the reverse order than it was found by the algorithm.
                    path.reverse();
                    paths.push(path);
                }
                // продолжаем итерации
            }
        }
    }

    if !paths.is_empty() {
        Some(paths)
    } else {
        None
    }
}