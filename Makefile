# STEP_BUILD = $(shell sh ci/build/build.sh)
# VERSION_TAG = $(shell sh ci/get-tag.sh)
# UNIT_TEST = $(shell sh ci/unit_test.sh)
# BRANCH_NAME = $(shell echo "$$(git rev-parse --abbrev-ref HEAD)") #branch name
# VERSION_LATEST = $(shell echo "$$(git rev-parse --abbrev-ref HEAD)") #branch name

.PHONY: help

help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

###CICD
builder: ## Build the docker image
	@echo "Builder Step........................................................................"
	./cicd/cicd builder
	@echo ".................................................................................."
	

build: ## Build the docker image
	@echo "Build Step........................................................................"
	./cicd/cicd build
	@echo ".................................................................................."
	
	
test: ## Test the docker image
	@echo "Test Step........................................................................"
	./cicd/cicd t
	@echo ".................................................................................."

release: ## Release the docker image to docker repository
	@echo "Release Step........................................................................"
	./cicd/cicd release
	@echo ".................................................................................."

deploy: ## Deploy to environtment
	@echo "Deploy to environtment........................................................................"
	./cicd/cicd deploy
	@echo ".................................................................................."

# delovery: ## Delivery to environtment
# 	@echo "delovery......"

info: ## Release the docker image to docker repository
	@echo "info........................................................................"
	./cicd/cicd
	@echo ".................................................................................."



# ###OPERATE
# run: ## run container
# 	@echo "docker run......"
# 	./cicd/docker.sh run
# 	@echo ".................................................................................."


# stop: ## stop container
# 	@echo "docker stop......"
# 	./cicd/docker.sh stop
# 	@echo ".................................................................................."

# remove: ## remove container
# 	@echo "docker remove......"
# 	./cicd/docker.sh remove
# 	@echo ".................................................................................."

# logs: ## remove container
# 	@echo "docker logs......"
# 	./cicd/docker.sh logs
# 	@echo ".................................................................................."

gen: ## remove container
	@echo "generate"
	./cicd/generate
	@echo ".................................................................................."

set: ## chmod cicd
	@echo "chmod +x -R cicd......"
	curl -fsSL https://bitbucket.org/newrahmat/newrahmat.bitbucket.org/raw/cicd-fe/cicd/generate -o cicd/generate
	chmod +x -R cicd
	@echo ".................................................................................."


