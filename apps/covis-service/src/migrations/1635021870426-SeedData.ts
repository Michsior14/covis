import { DiseasePhase, Gender, Location, Person } from '@covis/shared';
import { parse, transform } from 'csv';
import { createReadStream } from 'fs';
import { Point } from 'geojson';
import { join } from 'path';
import { cwd } from 'process';
import { pipeline as nonPromisePipeline } from 'stream';
import { MigrationInterface } from 'typeorm';
import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';
import { promisify } from 'util';
import { createGunzip } from 'zlib';

const pipeline = promisify(nonPromisePipeline);
const reportOn = 1_000_000;
const maxBulkWriteSize = 100_000;

export class SeedData1635021870426 implements MigrationInterface {
  public async up(queryRunner: MongoQueryRunner): Promise<void> {
    const db = queryRunner.databaseConnection.db();

    await Promise.all([
      db.createCollection('location'),
      db.createCollection('person'),
    ]);

    const createLocOp = () => queryRunner.initializeUnorderedBulkOp('location');
    const createPerOp = () => queryRunner.initializeUnorderedBulkOp('person');

    const start = performance.now();

    let count = 0;
    let locOp = createLocOp();
    let perOp = createPerOp();

    await pipeline(
      createReadStream(
        join(cwd(), 'apps/covis-service/src/assets/data.csv.gz')
      ),
      createGunzip(),
      parse({ from: 2 }),
      transform({ parallel: 1 }, (line: string[], cb) => {
        const hour = parseFloat(line[0]);
        const ok = () => cb(null, null);

        const location: Location = {
          hour: parseFloat(line[0]),
          personId: parseInt(line[1], 10),
          diseasePhase: line[12].toLowerCase() as DiseasePhase,
          location: this.createPointValue(line[9], line[8]), // currentLon, currentLat
        };
        locOp.insert(location);

        if (hour === 0) {
          const person: Person = {
            id: parseInt(line[1], 10),
            type: line[2].toLowerCase(),
            age: parseInt(line[3], 10),
            gender: line[4].toLowerCase() as Gender,
            homeId: parseInt(line[5], 10),
            homeSubId: parseInt(line[6], 10),
            workId: parseInt(line[13], 10),
            schoolId: parseInt(line[14], 10),
            location: this.createPointValue(line[11], line[10]), // homeLon, homeLat
          };
          perOp.insert(person);
        }

        if (++count % reportOn === 0) {
          console.log(`${count / reportOn} milions of rows processed.`);
        }

        if (locOp.length % maxBulkWriteSize === 0) {
          return locOp.execute(() => {
            locOp = createLocOp();

            if (perOp.length !== 0) {
              return perOp.execute(() => {
                perOp = createPerOp();
                ok();
              });
            }
            ok();
          });
        }
        ok();
      })
    );

    if (locOp.length !== 0) {
      await locOp.execute();
    }

    console.log(`Creating indexes for ${count} rows...`);
    await queryRunner.createCollectionIndexes('location', [
      {
        key: { hour: 1, location: '2dsphere', personId: 1 },
        name: 'hour-location-personId',
      },
      {
        key: { hour: 1, diseasePhase: 1 },
        name: 'hour-diseasePhase',
      },
    ]);
    await queryRunner.createCollectionIndex('person', {
      id: -1,
    });

    console.log(
      `Conversion + import took ${
        (performance.now() - start) / 1000 / 60
      } minutes.`
    );
  }

  public async down(queryRunner: MongoQueryRunner): Promise<void> {
    const db = queryRunner.databaseConnection.db();

    try {
      await Promise.all([
        db.dropCollection('location'),
        db.dropCollection('person'),
      ]);
    } catch (e) {
      //do nothing if collections don't exist
    }
  }

  private createPointValue(lon: string, lat: string): Point {
    return {
      type: 'Point',
      coordinates: [
        parseFloat(this.removeQuotes(lon)),
        parseFloat(this.removeQuotes(lat)),
      ],
    };
  }

  private removeQuotes(value: string): string {
    return value[0] === '"' ? value.slice(1, -1) : value;
  }
}
