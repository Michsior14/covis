import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonEntity } from './person.entity';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(PersonEntity)
    private repository: Repository<PersonEntity>
  ) {}

  public findOne(id: string): Promise<PersonEntity | undefined> {
    return this.repository.findOne(id);
  }

  public findAll(): Promise<PersonEntity[]> {
    return this.repository.find();
  }
}
