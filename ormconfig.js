const { env } = require('process');

module.exports = {
  type: 'postgres',
  host: env.POSTGRES_HOST,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  entities: ['apps/covis-service/src/**/*.entity.ts'],
  migrations: ['apps/covis-service/src/migrations/**/*.ts'],
  cli: {
    migrationsDir: 'apps/covis-service/src/migrations',
  },
};
