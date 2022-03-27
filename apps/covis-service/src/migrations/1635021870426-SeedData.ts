import { parse, stringify, transform } from 'csv';
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
        stream: new PassThrough({ objectMode: true }),
        changeLine: (line: string[]) => {
          if (++count % reportOn === 0) {
            console.log(`${count / reportOn} milions of rows processed.`);
          }
          return [
            line[0], // hour
            line[1], // personId
            line[12].toLowerCase(), // diseasePhase
            this.createPointValue(line[9], line[8]), // currentLon, currentLat
          ];
        },
      },
      {
        table: 'person',
        stream: new PassThrough({ objectMode: true }),
        changeLine: (line: string[]) =>
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
            : null,
      },
    ];

    const pool = (queryRunner.connection.driver as PostgresDriver)
      .master as Pool;

    const dataStream = createReadStream(
      join(cwd(), 'apps/covis-service/src/assets/data.csv.gz')
    )
      .pipe(createGunzip())
      .pipe(parse({ from: 2 }));

    await Promise.all(
      tasks.map(async ({ table, changeLine, stream }) => {
        const client = await pool.connect();
        dataStream.pipe(stream);

        await pipeline(
          stream,
          transform(changeLine.bind(this)),
          stringify(),
          client.query(from(`COPY ${table} FROM STDIN WITH (FORMAT csv)`))
        );

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
