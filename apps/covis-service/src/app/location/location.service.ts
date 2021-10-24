import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadStream } from 'typeorm/platform/PlatformTools';
import { LocationEntity } from './location.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationEntity)
    private repository: Repository<LocationEntity>
  ) {}

  public findOne(id: string): Promise<LocationEntity | undefined> {
    return this.repository.findOne(id);
  }

  public findAll(skip?: number, take = 50): Promise<LocationEntity[]> {
    return this.repository.find({
      skip,
      take,
      order: { hour: 'ASC', personId: 'ASC' },
    });
  }

  public findAllStream(skip?: number, take = 50): Promise<ReadStream> {
    return this.repository
      .createQueryBuilder('location')
      .select('*')
      .orderBy({
        'location.hour': 'ASC',
        'location.personId': 'ASC',
      })
      .offset(skip)
      .limit(take)
      .stream();
  }
}
