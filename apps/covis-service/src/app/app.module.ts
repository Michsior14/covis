import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '../data-source';
import { AppController } from './app.controller';
import { LocationModule } from './location/location.module';
import { PersonModule } from './person/person.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      entities: [],
      migrations: [],
      migrationsRun: false,
      autoLoadEntities: true,
    }),
    PersonModule,
    LocationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
