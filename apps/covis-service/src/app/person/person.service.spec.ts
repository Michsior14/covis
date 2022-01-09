import { Gender } from '@covis/shared';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonEntity } from './person.entity';
import { PersonService } from './person.service';

class PersonEntityRepository {
  findOne = jest.fn();
  find = jest.fn();
}

const resultPerson: PersonEntity = {
  id: 0,
  type: '',
  age: 0,
  gender: Gender.male,
  homeId: 0,
  homeSubId: 0,
  workId: 0,
  schoolId: 0,
  location: {
    type: 'Point',
    coordinates: [0, 0],
  },
};

describe('PersonService', () => {
  let service: PersonService;
  let repository: Repository<PersonEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: getRepositoryToken(PersonEntity),
          useClass: PersonEntityRepository,
        },
      ],
    }).compile();

    service = module.get(PersonService);
    repository = module.get(getRepositoryToken(PersonEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne', () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(resultPerson);

    const id = 'id';
    expect(service.findOne(id)).resolves.toBe(resultPerson);
    expect(repository.findOne).toHaveBeenCalledWith(id);
  });

  it('findAll', () => {
    jest.spyOn(repository, 'find').mockResolvedValue([resultPerson]);
    expect(service.findAll()).resolves.toEqual([resultPerson]);
    expect(repository.find).toBeCalledWith();
  });
});
