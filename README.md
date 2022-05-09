# Covis

The visualization platform of covid simulation in the Hague.

## Quick start

To start the whole stack without much hustle you can use docker with docker-compose.

1. Copy:
   - `.env.example` to `.env` and change the variables to value of choose
   - gziped csv file from simulation to `apps/covis-service/src/assets` and name it `data.csv.gz`

2. Build the images:

    ```sh
    sh ./tools/scripts/docker-build.sh
    ```

3. Start (keep it running):

    ```sh
    docker-compose -f docker-compose.prod.yml up # add '-d' if you want to run it in the background
    ```

4. Seed (optional):

    ```sh
    sh ./tools/scripts/docker-seed.sh
    ```

5. Navigate to: <http://localhost>

## Advanced usage

### Requirements

- Node 16.x.x (preferably over nvm/asdf)
- Yarn 3
- Docker w/ docker-compose or pre-installed postgis endpoint

### Setup

1. Install dependencies

   ```sh
   yarn install && docker-compose pull
   ```

2. Copy `.env.example` to `.env` and change the variables to value of choose.

### Database

The project uses `postgis` database to handle geo-location data.

#### Start w/ docker

It's as easy as just running provided `docker-compose.yml` file.

```sh
docker-compose up # add '-d' if you want to run it in the background
```

#### Start w/o docker

Install `postgis` depending on your operating system and configure it as you wish.

#### Synchronize database schema

Make sure the database is running!

Execute the following command to create all needed db structures:

```sh
yarn schema:sync
```

#### Seed the database

Make sure the database is running!

#### Using typescript (a bit slower)

1. Move gziped csv file to `apps/covis-service/src/assets` and name it `data.csv.gz`.
2. Run migration script and be patient, it will take some time.

   ```sh
   yarn migration:run
   ```

#### Using SQL (faster)

1. Move gziped csv file to folder accessible on SQL server (for docker-compose: `./data`) and name it `data.csv.gz`.
2. Move `apps/covis-service/seed.sql` to folder accessible on SQL server (for docker-compose: `./data`).
3. Connect to the SQL server and execute the above script and be patient, it will take some time.
   - To accomplish this with docker, use the following command:

      ```sh
      docker exec <container-name> psql -U <user> -d <database> -f /var/lib/postgresql/data/seed.sql
      ```

### Run the apps in development mode

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

### Run the apps in production mode

Build all apps using the following script:

```sh
yarn build:all
```

Use reverse proxy to serve the apps. Distribution files can be found in `dist/apps` folder.
