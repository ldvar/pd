
use serde::{Serialize, Deserialize};
use std::convert::TryFrom;
use std::error::Error;


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PoolData {
    pub id: usize,
    pub token0_id: usize,
    pub token1_id: usize,
    pub weight: f32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PoolsDataPacket {
    pub pools_data: Vec<PoolData>,
}

impl TryFrom<&[u8]> for PoolsDataPacket {
    type Error = Box<dyn Error + Send + Sync> ;
    fn try_from(bytes: &[u8]) -> Result<Self, Self::Error> {
        serde_json::from_slice(bytes)
            // we allow rust to loose the type, so the next line is equivalent to this:
            //.map_err(|e|Box::new(e ) as Box<dyn Error + Send + Sync>)
            .map_err(|e|e.into())
    }
}

///

#[derive(Serialize, Deserialize, Debug)]
pub struct FoundPaths {
    pub node_paths: Vec<Vec<usize>>,
    pub edge_paths: Vec<Vec<usize>>,
}
