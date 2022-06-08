
use structopt::StructOpt;


#[derive(StructOpt, Debug, Clone)]
#[structopt(name = "graph_search")]
pub struct Config {
    #[structopt(short, long, default_value = "127.0.0.1:9092")]
    pub kafka_broker: String,

    #[structopt(short, long, default_value = "graph_search_group")]
    pub kafka_consumer_group: String,

    #[structopt(short, long, default_value = "pools.datastream.processed")]
    pub kafka_input_topic: String,

    #[structopt(short, long, default_value = "opportunities.primary_search.found")]
    pub kafka_output_topic: String,

    #[structopt(short, long, default_value = "1")]
    pub parallel_operations: usize,
}
