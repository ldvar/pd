
prepare_storage:
	mkdir -p storage
	chown -R 1000:1000 storage

####

data_services_up:
	docker-compose -f docker-compose.data-only.yml up -d

data_services_down:
	docker-compose -f docker-compose.data-only.yml down

###

services_up:
	docker-compose -f docker-compose.services.yml up -d

services_down:
	docker-compose -f docker-compose.services.yml down

###

start_pools:
	cd services; yarn build pools; yarn start pools
