FROM node:16-alpine

WORKDIR /app

COPY .yarn/ .yarn/
COPY .yarnrc.yml .

COPY package.json .
COPY yarn.lock .
COPY decorate-angular-cli.js .

RUN yarn install

COPY . .

RUN yarn nx run-many --target=build  --projects=covis-app,covis-service --prod --parallel
