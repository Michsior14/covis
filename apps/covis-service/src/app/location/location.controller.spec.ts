import { DetailLevel } from '@covis/shared';
import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { AreaRequest, Page } from './location.entity';
import { LocationService } from './location.service';

const locationServiceMock = {
  findAllInArea: jest.fn(),
  findAll: jest.fn(),
  getHourRange: jest.fn(),
};

describe('LocationController', () => {
  let controller: LocationController;
  let service: LocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationController,
        { provide: LocationService, useValue: locationServiceMock },
      ],
    }).compile();

    controller = module.get(LocationController);
    service = module.get(LocationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAll', () => {
    jest.spyOn(service, 'findAll').mockResolvedValue([]);

    const page: Page = { details: DetailLevel.medium, from: 0, take: 10 };
    expect(controller.getAll(page)).resolves.toEqual([]);
    expect(service.findAll).toBeCalledWith(page);
  });

  it('getAllHour', () => {
    jest.spyOn(service, 'findAllInArea').mockResolvedValue([]);

    const area: AreaRequest = {
      lats: 0,
      lngw: 0,
      latn: 0,
      lnge: 0,
      zoom: 0,
      hour: 0,
    };
    const page: Page = { details: DetailLevel.medium, from: 0, take: 10 };
    expect(controller.getAllHour(area, page)).resolves.toEqual([]);
    expect(service.findAllInArea).toBeCalledWith(area, page);
  });

  it('getHourRange', () => {
    const response = { min: 0, max: 0 };
    jest.spyOn(service, 'getHourRange').mockResolvedValue(response);
    expect(controller.getHourRange()).resolves.toEqual(response);
  });
});
