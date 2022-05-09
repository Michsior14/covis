FROM covis-base:latest AS base

FROM node:16-alpine
WORKDIR /app

COPY --from=base /app/dist/apps/covis-service .

RUN yarn install

CMD ["node", "./main.js"]

HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1
EXPOSE 3000
