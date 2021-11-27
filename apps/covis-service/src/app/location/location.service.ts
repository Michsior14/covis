import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Raw, Repository } from 'typeorm';
import { LocationEntity, Page } from './location.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private repository: Repository<LocationEntity>
  ) {}

  public findOne(id: string): Promise<LocationEntity | undefined> {
    return this.repository.findOne(id);
  }

  public findAllForHour(hour: number, page: Page): Promise<LocationEntity[]> {
    return this.findAll(page, { where: { hour } });
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
      where: {
        personId: Raw((alias) => `${alias} % 10000 = 0`),
      },
      skip: from,
      take: take ?? 1000,
      cache: true,
    });
  }
}
