.PHONY: install build watch clean test run bot up down up-prod
default: run

TYPESCRIPT_VERSION=5.5.4
INSTALL_DIR=./node_modules/typescript/bin/
TSC=tsc
	
install:
	npm i
	npm i -g typescript
	npm audit fix

build:
	$(TSC) --project tsconfig.json

watch:
	$(TSC) --watch

clean:
	npm run clean

test:
	npm run test

lint:
	npm run lint
run:
	npm i
	npm i -g typescript
	npm audit fix
	npm run start

bot:
	npm run bot

up:
	docker-compose up -d

down: 
	docker-compose down

up-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
