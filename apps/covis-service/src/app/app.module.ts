import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getConnectionOptions } from 'typeorm';
import { AppController } from './app.controller';
import { LocationModule } from './location/location.module';
import { PersonModule } from './person/person.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        return {
          ...(await getConnectionOptions()),
          entities: [],
          migrations: [],
          migrationsRun: false,
          autoLoadEntities: true,
        };
      },
    }),
    PersonModule,
    LocationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
