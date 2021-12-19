import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Raw, Repository } from 'typeorm';
import { AreaRequest, LocationEntity, Page } from './location.entity';

@Injectable()
export class LocationService {
  private zoomDetails = [
    { zoom: 11, value: 1000 },
    { zoom: 13, value: 500 },
    { zoom: 15, value: 300 },
    { zoom: 16, value: 100 },
    { zoom: 17.5, value: 10 },
  ];

  constructor(
    @InjectRepository(LocationEntity)
    private repository: Repository<LocationEntity>
  ) {}

  public findOne(id: string): Promise<LocationEntity | undefined> {
    return this.repository.findOne(id);
  }

  public findAllInArea(
    { hour, zoom, ...area }: AreaRequest,
    page: Page
  ): Promise<LocationEntity[]> {
    const detail = this.zoomDetails.find((z) => z.zoom >= zoom)?.value ?? 1;
    return this.findAll(page, {
      where: {
        hour,
        location: Raw(
          (alias) =>
            `st_intersects(
              ${alias},
              ST_MakeEnvelope(:lngw, :lats, :lnge, :latn, 4326)
            )`,
          area
        ),
        personId: Raw((alias) => `${alias} % :detail = 0`, { detail }),
      },
    });
  }

  public findAll(
    { from, take }: Page,
    options?: FindManyOptions<LocationEntity>
  ): Promise<LocationEntity[]> {
    return this.repository.find({
      ...options,
      order: {
        hour: 'ASC',
        personId: 'ASC',
      },
      skip: from,
      take: take ?? 1000,
      cache: true,
    });
  }
}