
use rdkafka::{ClientConfig};
use rdkafka::config::RDKafkaLogLevel;
use rdkafka::consumer::{Consumer};
use rdkafka::producer::FutureProducer;
use rdkafka::consumer::StreamConsumer;


pub fn create_producer(brokers: &str, ) -> FutureProducer {
    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("message.timeout.ms", "5000")
        .set_log_level(RDKafkaLogLevel::Debug)
        .create()
        .expect("Producer creation error");

    producer
}

pub fn create_consumer(brokers: &str, group_id: &str, topic: &str) -> StreamConsumer {

    let consumer: StreamConsumer  = ClientConfig::new()
        .set("group.id", group_id)
        .set("bootstrap.servers", brokers)
        .set("enable.partition.eof", "false")
        .set("allow.auto.create.topics", "true")
        .set("enable.auto.commit", "true")
        .set("auto.commit.interval.ms", "100")
        .set("enable.auto.offset.store", "true")
        .set_log_level(RDKafkaLogLevel::Debug)
        .create()
        .expect("Consumer creation failed");

    consumer
        .subscribe(&[topic])
        .expect("Can't subscribe to specified topic");

    consumer
}
