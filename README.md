
prerequisites:

install nest...

sudo apt install make pkg-config docker-compose libssl-dev rustc rust-src


prepare storage:

sudo make prepare_storage


start persistence/communication services:

sudo make data_services_up 
