
# Covis

The visualization platform of covid simulation in The Hauge.

## Requirements

- Node 16.x.x (preferably over nvm/asdf)
- Yarn 3
- Docker w/ docker-compose or pre-installed postgis endpoint

## Setup

1. Install dependencies

   ```sh
   yarn install & docker-compose pull
   ```

2. Copy `.env.example` to `.env` and change the variables to value of choose.

## Database

The project uses `postgis` database to handle geolocation data.

### Start w/ docker

It's as easy as just running provided `docker-compose.yml` file.

```sh
docker-compose up # add '-d' if you want to run it in the background
```

### Start w/o docker

Install postgis depending on your operating system and configure it as you wish.

## Seed the database

Make sure the database is running!

1. Move gziped csv file to `apps/covis-service/src/assets` and name it `data.csv.gz`.
2. Run migration script and be patient, it will take some time.

    ```sh
    yarn migration:run
    ```

## Run the apps in development mode

Make sure the database is running!

The app will be available on <http://localhost:4200>.

To start both apps at once you can use the following script:

```sh
yarn serve:all
```

If you want you can also just run them separately:

```sh
yarn serve covis-app # start the frontend
yarn serve covis-service # start the backend
```

## Run the apps in production mode

Build all apps using the following script:

```sh
yarn build:all
```

Use reverse proxy to serve the apps. Distribution files can be found in `dist/apps` folder.
