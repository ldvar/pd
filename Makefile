
#prepare_storage:
#	mkdir -p storage
#	sudo chown -R 1000:1000 storage

#clear_storage:
#	sudo rm -rf storage

clear_storage:
	docker volume rm pd_kafka_data pd_zookeeper_data pd_redis_data -f

####

data_services_up:
	docker-compose -f docker-compose.data-only.services.yml up -d

data_services_down:
	docker-compose -f docker-compose.data-only.services.yml down

###

services_up:
	docker-compose -f docker-compose.data-only.yml -f docker-compose.services.yml up -d

services_down:
	docker-compose -f docker-compose.data-only.yml -f docker-compose.services.yml down

###
app_services_up:
	docker-compose -f ./dockerize/app_services.yml up -d

app_services_down:
	docker-compose -f ./dockerize/app_services.yml down
	
###

start_pools:
	cd services; yarn start pools

start_pools_data_fetcher:
	cd services; yarn start pools_data_fetcher
