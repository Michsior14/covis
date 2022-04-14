import { DetailLevel, DiseasePhase, MinMaxRange } from '@covis/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Raw, Repository } from 'typeorm';
import {
  AreaRequest,
  LocationEntity,
  Page,
  StatsHourResponse,
  StatsResponse,
} from './location.entity';

@Injectable()
export class LocationService {
  private zoomDetails: Record<DetailLevel, { zoom: number; value: number }[]> =
    {
      [DetailLevel.low]: [
        { zoom: 16, value: 5 },
        { zoom: 15, value: 200 },
        { zoom: 13, value: 400 },
        { zoom: 12, value: 600 },
        { zoom: 0, value: 1500 },
      ],
      [DetailLevel.medium]: [
        { zoom: 16, value: 2 },
        { zoom: 15, value: 100 },
        { zoom: 13, value: 300 },
        { zoom: 12, value: 500 },
        { zoom: 0, value: 1000 },
      ],
      [DetailLevel.high]: [
        { zoom: 16, value: 1 },
        { zoom: 15, value: 50 },
        { zoom: 13, value: 150 },
        { zoom: 12, value: 250 },
        { zoom: 0, value: 500 },
      ],
    };

  constructor(
    @InjectRepository(LocationEntity)
    private repository: Repository<LocationEntity>
  ) {}

  public findOne(
    hour: number,
    personId: number
  ): Promise<LocationEntity | null> {
    return this.repository.findOneBy({ hour, personId });
  }

  public findAllInArea(
    { hour, zoom, ...area }: AreaRequest,
    page: Page
  ): Promise<LocationEntity[]> {
    const level = page.details ?? DetailLevel.medium;
    const detail =
      this.zoomDetails[level].find((z) => zoom >= z.zoom)?.value ?? 1;
    return this.findAll(page, {
      where: {
        hour,
        personId: Raw((alias) => `${alias} % :detail = 0`, { detail }),
        location: Raw(
          (alias) =>
            `ST_Within(
              ${alias},
              ST_MakeEnvelope(:lngw, :lats, :lnge, :latn, 4326)
            )`,
          area
        ),
      },
    });
  }

  public findAll(
    { from, take }: Page,
    options?: FindManyOptions<LocationEntity>
  ): Promise<LocationEntity[]> {
    return this.repository.find({
      ...options,
      skip: from,
      take: take ?? 1000,
    });
  }

  public getHourRange(): Promise<MinMaxRange> {
    return this.repository
      .createQueryBuilder('location')
      .select('MIN(location.hour)', 'min')
      .addSelect('MAX(location.hour)', 'max')
      .getRawOne() as Promise<MinMaxRange>;
  }

  public async getStats(): Promise<StatsResponse> {
    const stats = await this.repository
      .createQueryBuilder('location')
      .select('location.hour', 'hour')
      .addSelect('location.diseasePhase', 'diseasePhase')
      .addSelect('count(*)', 'value')
      .groupBy('location.diseasePhase')
      .addGroupBy('location.hour')
      .getRawMany<{
        hour: number;
        diseasePhase: DiseasePhase;
        value: number;
      }>();

    const hourObject = stats.reduce<Record<string, StatsHourResponse>>(
      (acc, curr) => ({
        ...acc,
        [curr.hour]: {
          ...(acc[curr.hour] ?? {}),
          [curr.diseasePhase]: curr.value,
        },
      }),
      {}
    );

    const keys = Object.keys(hourObject)
      .map((key) => parseInt(key))
      .sort((a, b) => a - b);

    return { hours: keys.map<StatsHourResponse>((key) => hourObject[key]) };
  }
}
