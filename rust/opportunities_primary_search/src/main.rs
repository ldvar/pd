
mod graph;
mod config;
mod kafka;
mod handle;
mod model;
mod process;
mod task;

use futures::future::join_all;
use structopt::StructOpt;
use tokio::runtime::Runtime;
use simple_logger;

use config::Config;
use task::task;


//#[tokio::main]
fn main() {
    simple_logger::init_with_level(log::Level::Debug).unwrap();

    let config = Config::from_args();

    Runtime::new().unwrap().block_on(async {
        let futures =
            (0..config.parallel_operations)
                .map(|_| {
                    tokio::spawn(task(config.clone()))
                });

        join_all(futures).await;
    });
}
