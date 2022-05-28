import { parse, stringify, transform, transformer } from 'csv';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { from } from 'pg-copy-streams';
import { cwd } from 'process';
import { PassThrough, pipeline as nonPromisePipeline } from 'stream';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver';
import { promisify } from 'util';
import { createGunzip } from 'zlib';

const pipeline = promisify(nonPromisePipeline);
const reportOn = 1_000_000;

export class SeedData1635021870426 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const start = performance.now();
    let count = 0;
    const tasks = [
      {
        table: 'location',
        index:
          'create index if not exists "location_hour_personId_location_idx" on "location" using gist ("hour", "personId", "location")',
        stream: new PassThrough({ objectMode: true }),
        changeLine: (line: string[], cb: transformer.HandlerCallback) => {
          if (++count % reportOn === 0) {
            console.log(`${count / reportOn} millions of rows processed.`);
          }
          cb(null, [
            line[0], // hour
            line[1], // personId
            line[12].toLowerCase(), // diseasePhase
            this.createPointValue(line[9], line[8]), // currentLon, currentLat
          ]);
        },
      },
      {
        table: 'person',
        index:
          'create index if not exists "person_location_idx" on "person" using gist ("location")',
        stream: new PassThrough({ objectMode: true }),
        changeLine: (line: string[], cb: transformer.HandlerCallback) =>
          cb(
            null,
            line[0] === '0.0'
              ? [
                  line[1], // personId
                  line[2].toLowerCase(), // personType
                  line[3], // age
                  line[4].toLowerCase(), // gender
                  line[5], // homeId
                  line[6], // homeSubId
                  line[13], // workId
                  line[14], // schoolId
                  this.createPointValue(line[11], line[10]), // homeLon, homeLat
                ]
              : null
          ),
      },
    ];

    const pool = (queryRunner.connection.driver as PostgresDriver)
      .master as Pool;

    const dataStream = createReadStream(
      join(cwd(), 'apps/covis-service/src/assets/data.csv.gz')
    )
      .pipe(createGunzip())
      .pipe(parse({ from: 2 }));

    await queryRunner.query('create extension if not exists btree_gist');
    await Promise.all(
      tasks.map(async ({ table, index, changeLine, stream }) => {
        const client = await pool.connect();
        dataStream.pipe(stream);

        await pipeline(
          stream,
          transform((line, cb) => changeLine(line, cb)),
          stringify(),
          client.query(from(`COPY ${table} FROM STDIN WITH (FORMAT csv)`))
        );

        console.log(`Creating index for ${table}...`);
        await queryRunner.query(index);

        client.release();
      })
    );

    dataStream.destroy();

    console.log(
      `Conversion + import took ${
        (performance.now() - start) / 1000 / 60
      } minutes.`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.clearTable('person');
    await queryRunner.clearTable('location');
    await queryRunner.query(
      'drop index if exists "location_hour_personId_location_idx"'
    );
    await queryRunner.query('drop index if exists "person_location_idx"');
    await queryRunner.query('drop extension if exists btree_gist');
  }

  private createPointValue(lon: string, lat: string): string {
    return `SRID=4326;POINT(${this.removeQuotes(lon)} ${this.removeQuotes(
      lat
    )})`;
  }

  private removeQuotes(value: string): string {
    return value[0] === '"' ? value.slice(1, -1) : value;
  }
}
