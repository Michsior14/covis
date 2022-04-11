import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { PersonEntity } from './person.entity';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(PersonEntity)
    private repository: MongoRepository<PersonEntity>
  ) {}

  public findOne(id: number): Promise<PersonEntity | null> {
    return this.repository.findOneBy({ id });
  }

  public findAll(): Promise<PersonEntity[]> {
    return this.repository.find();
  }
}
