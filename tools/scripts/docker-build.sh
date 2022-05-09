#!/usr/bin/env bash
paths=( covis-app covis-service )

docker build -t covis-base:latest .

for app in "${paths[@]}"
do
  cd "./apps/${app}"
  docker build . -t "${app}:latest"
  cd -
done
