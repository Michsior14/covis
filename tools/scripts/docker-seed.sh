#!/usr/bin/env bash

docker run --network host --env-file ./.env -t covis-base yarn schema:sync

docker exec -it postgis bash -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB -f /var/lib/postgresql/data/seed.sql'
