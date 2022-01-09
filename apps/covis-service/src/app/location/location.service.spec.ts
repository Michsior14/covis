import { DetailLevel, DiseasePhase } from '@covis/shared';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { AreaRequest, LocationEntity, Page } from './location.entity';
import { LocationService } from './location.service';

class LocationEntityRepository {
  findOne = jest.fn();
  find = jest.fn();
}

const resultLocation: LocationEntity = {
  hour: 0,
  diseasePhase: DiseasePhase.healthy,
  location: {
    type: 'Point',
    coordinates: [0, 0],
  },
  personId: 0,
};

describe('LocationService', () => {
  let service: LocationService;
  let repository: Repository<LocationEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: getRepositoryToken(LocationEntity),
          useClass: LocationEntityRepository,
        },
      ],
    }).compile();

    service = module.get(LocationService);
    repository = module.get(getRepositoryToken(LocationEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne', () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(resultLocation);

    const id = 'id';
    expect(service.findOne(id)).resolves.toBe(resultLocation);
    expect(repository.findOne).toHaveBeenCalledWith(id);
  });

  describe('findAllInArea', () => {
    beforeEach(() => {
      jest.spyOn(service, 'findAll').mockResolvedValue([resultLocation]);
    });

    it('should return location if all params are passed', () => {
      const area: AreaRequest = {
        lats: 0,
        lngw: 0,
        latn: 0,
        lnge: 0,
        zoom: 0,
        hour: 0,
      };
      const page: Page = { details: DetailLevel.high, from: 0, take: 10 };
      expect(service.findAllInArea(area, page)).resolves.toEqual([
        resultLocation,
      ]);
      expect(JSON.stringify((service.findAll as jest.Mock).mock.calls[0])).toBe(
        JSON.stringify([
          page,
          {
            where: {
              hour: area.hour,
              location: Raw(
                (alias) =>
                  `st_intersects(
              ${alias},
              ST_MakeEnvelope(:lngw, :lats, :lnge, :latn, 4326)
            )`,
                { lats: 0, lngw: 0, latn: 0, lnge: 0 }
              ),
              personId: Raw((alias) => `${alias} % :detail = 0`, {
                detail: 500,
              }),
            },
          },
        ])
      );
    });

    it('should return location if not all parameters are passed', () => {
      const area: AreaRequest = {
        lats: 0,
        lngw: 0,
        latn: 0,
        lnge: 0,
        zoom: 0,
        hour: 0,
      };
      expect(service.findAllInArea(area, {})).resolves.toEqual([
        resultLocation,
      ]);
      expect(JSON.stringify((service.findAll as jest.Mock).mock.calls[0])).toBe(
        JSON.stringify([
          {},
          {
            where: {
              hour: area.hour,
              location: Raw(
                (alias) =>
                  `st_intersects(
              ${alias},
              ST_MakeEnvelope(:lngw, :lats, :lnge, :latn, 4326)
            )`,
                { lats: 0, lngw: 0, latn: 0, lnge: 0 }
              ),
              personId: Raw((alias) => `${alias} % :detail = 0`, {
                detail: 1000,
              }),
            },
          },
        ])
      );
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      jest.spyOn(repository, 'find').mockResolvedValue([resultLocation]);
    });

    it('should return location if all params are passed', () => {
      const page: Page = { from: 0, take: 10 };
      expect(service.findAll(page)).resolves.toEqual([resultLocation]);
      expect(repository.find).toBeCalledWith({
        order: {
          hour: 'ASC',
          personId: 'ASC',
        },
        skip: page.from,
        take: page.take,
        cache: true,
      });
    });

    it('should return location if not all params are passed', () => {
      expect(service.findAll({})).resolves.toEqual([resultLocation]);
      expect(repository.find).toBeCalledWith({
        order: {
          hour: 'ASC',
          personId: 'ASC',
        },
        take: 1000,
        cache: true,
      });
    });
  });
});
