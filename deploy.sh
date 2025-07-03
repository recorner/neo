set -a
source .env.prod

DOCKER_HOST=ssh://${REMOTE_USER}@${REMOTE_HOST}

docker-compose \
  --env-file .env.prod \
  --project-name ${COMPOSE_PROJECT_NAME} \
  --file docker-compose.yml \
  up -d --build