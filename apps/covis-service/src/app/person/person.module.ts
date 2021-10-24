import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonEntity } from './person.entity';
import { PersonService } from './person.service';

@Module({
  imports: [TypeOrmModule.forFeature([PersonEntity])],
  providers: [PersonService],
  controllers: [],
})
export class PersonModule {}
