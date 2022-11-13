
use crate::config::Config;
use crate::kafka::{ create_consumer, create_producer };
use crate::handle::handle_messages;
use crate::process::search_paths_in_data_packet;

use log::{debug};

pub async fn task(config: Config) {
    let consumer = create_consumer(
        &config.kafka_broker,
        &config.kafka_consumer_group,
        &config.kafka_input_topic);

    let producer = create_producer(&config.kafka_broker);
    let output_topic = config.kafka_output_topic.to_owned();

    debug!("initialized task");

    handle_messages(consumer, producer, output_topic, search_paths_in_data_packet).await;
}
