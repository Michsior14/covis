import { join } from 'path';
import { env } from 'process';
import { DataSource, DataSourceOptions } from 'typeorm';

const fromSrc = (path: string) => join(__dirname, path);

export const dataSourceOptions: DataSourceOptions = {
  type: 'mongodb',
  host: env.MONGODB_HOST,
  username: env.MONGODB_USER,
  password: env.MONGODB_PASSWORD,
  database: env.MONGODB_DB,
  authSource: env.MONGODB_AUTH_SOURCE,
  entities: [fromSrc('**/*.entity.ts')],
  migrations: [fromSrc('migrations/**/*.ts')],
};

export const dataSource = new DataSource(dataSourceOptions);
