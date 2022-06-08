
use petgraph::visit::GraphBase;


pub type Path<G> = Vec<<G as GraphBase>::NodeId>;
pub type EdgePath<G> = Vec<<G as GraphBase>::EdgeId>;
