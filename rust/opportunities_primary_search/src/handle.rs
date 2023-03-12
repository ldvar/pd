
use std::convert::TryFrom;
use std::error::Error;
use std::time::Duration;

use log::{error, debug, trace, warn};

use futures::StreamExt;
use rdkafka::Message;
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::consumer::StreamConsumer;
use rdkafka::util::Timeout;

use crate::model::PoolsDataPacket;


pub async fn send_results_message(producer: &FutureProducer, output_topic: String, str_rep: String)
    -> Result<(), Box<dyn Error + Send + Sync>> 
{
    let record = FutureRecord::to(&output_topic)
        .key("found_paths".into())
        .payload(&str_rep);

    let produce_future = producer.send(record, Timeout::After(Duration::ZERO));
    match produce_future.await {
        Ok((t1, t2)) => debug!("Sent: {:?}, {:?}", t1, t2),
        Err(_) => error!("Future cancelled"),
    }

    Ok(())
}

pub async fn publish_results(producer: &FutureProducer, output_topic: String, results: (Vec<Vec<usize>>, Vec<Vec<usize>>)) {
    let str_rep = serde_json::to_string(&results).unwrap_or("".into());

    let res = send_results_message(&producer, output_topic, str_rep).await;
    if res.is_err(){error!("Error sending ack: {}", res.err().expect("Fatal: could not send ack"))}
}

pub async fn handle_messages<F>(
    consumer: StreamConsumer,
    producer: FutureProducer,
    output_topic: String,
    handler: F) 
where F: Fn(PoolsDataPacket) -> Option<(Vec<Vec<usize>>, Vec<Vec<usize>>)>
{
    let mut msg_stream = consumer.stream();

    // iterate over all messages blocking
    while let Some(msg) = msg_stream.next().await {

        //debug!("message received");

        // the message itself can be broken
        match msg {
            Ok(msg) => {

                // tha payload can be empty
                match  msg.payload() {
                    Some(payload) => {
                        let data = PoolsDataPacket::try_from(payload);
                        
                        // only process valid messages
                        match data {
                            Ok(data_packet) => {
                                let results = handler(data_packet);
                                match results {
                                    Some(found_paths) => {
                                        let (a, b) = found_paths;
                                        warn!("{} OPPORTUNITIES FOUND", a.len());
                                        publish_results(&producer, output_topic.clone(), (a,b)).await
                                    },
                                    None => { 
                                        //debug!("...");
                                    }
                                }
                            }
                            Err(e) => {
                                error!("Error parsing payload: {}",e);
                            }
                        }
                    },
                    None => {
                        error!("Message with empty payload");
                    }
                }
            }
            Err(e)=>{
                match e {
                    rdkafka::error::KafkaError::PartitionEOF(_) => {
                        trace!("Stream EOF!");
                    }
                    _ => {
                        error!("Could not receive and will not process message: {}", e)
                    }
                }
                
            }
        };
    }
}
