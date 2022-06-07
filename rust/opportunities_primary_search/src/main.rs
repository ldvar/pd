
use tokio::runtime::Runtime;

use petgraph::Graph;
use petgraph::prelude::*;

mod find_negative_cycles;
use find_negative_cycles::find_negative_cycles;

fn main() {
    let graph = Graph::<(), f32, Directed>::from_edges(&[
        (0, 1, 1.),
        (0, 2, 1.),
        (0, 3, 1.),
        (1, 3, 1.),
        (2, 1, 1.),
        (3, 2, -3.),
    ]);

    let cycles = find_negative_cycles(&graph, NodeIndex::new(0));

    match cycles {
        Some(cycles) => {
            for cycle in cycles {
                for node in cycle {
                    println!("{:?}", node)
                }
                println!();
            }
        },
        None => { println!("syka") }
    }
}