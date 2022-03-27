import { env } from 'process';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

const fromSrc = (path: string) => join(__dirname, path);

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: env.POSTGRES_HOST,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  entities: [fromSrc('**/*.entity.ts')],
  migrations: [fromSrc('migrations/**/*.ts')],
};

export const dataSource = new DataSource(dataSourceOptions);
