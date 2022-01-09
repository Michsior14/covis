import { Gender } from '@covis/shared';
import { Test, TestingModule } from '@nestjs/testing';
import { PersonController } from './person.controller';
import { PersonEntity } from './person.entity';
import { PersonService } from './person.service';

const personServiceMock = {
  findOne: jest.fn(),
  findAll: jest.fn(),
};

describe('PersonController', () => {
  let controller: PersonController;
  let service: PersonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonController,
        { provide: PersonService, useValue: personServiceMock },
      ],
    }).compile();

    controller = module.get(PersonController);
    service = module.get(PersonService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAll', () => {
    jest.spyOn(service, 'findAll').mockResolvedValue([]);
    expect(controller.getAll()).resolves.toEqual([]);
    expect(service.findAll).toBeCalledWith();
  });

  it('get', () => {
    const id = 'id';
    const person: PersonEntity = {
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

    jest.spyOn(service, 'findOne').mockResolvedValue(person);

    expect(controller.get(id)).resolves.toEqual(person);
    expect(service.findOne).toBeCalledWith(id);
  });
});
