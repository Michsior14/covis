import { DetailLevel, DiseasePhase, MinMaxRange } from '@covis/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, ObjectLiteral } from 'typeorm';
import type { MongoFindManyOptions } from 'typeorm/find-options/mongodb/MongoFindManyOptions';
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
    private repository: MongoRepository<LocationEntity>
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
        location: {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [area.lngw, area.lats],
                  [area.lnge, area.lats],
                  [area.lnge, area.latn],
                  [area.lngw, area.latn],
                  [area.lngw, area.lats],
                ],
              ],
            },
          },
        },
        personId: { $mod: [detail, 0] },
      } as ObjectLiteral,
    });
  }

  public findAll(
    { from, take }: Page,
    options?: MongoFindManyOptions<LocationEntity>
  ): Promise<LocationEntity[]> {
    return this.repository.find({
      ...options,
      order: {
        hour: 'DESC',
        personId: 'DESC',
      },
      skip: from,
      take: take ?? 1000,
      cache: false,
    });
  }

  public async getHourRange(): Promise<MinMaxRange> {
    const results = await this.repository
      .aggregate<MinMaxRange>([
        {
          $facet: {
            min: [{ $sort: { hour: 1 } }, { $limit: 1 }],
            max: [{ $sort: { hour: -1 } }, { $limit: 1 }],
          },
        },
        {
          $project: {
            min: { $first: '$min.hour' },
            max: { $first: '$max.hour' },
          },
        },
      ])
      .toArray();
    return results[0];
  }

  public async getStats(): Promise<StatsResponse> {
    const stats = await this.repository
      .aggregate<{
        _id: { hour: number; diseasePhase: DiseasePhase };
        value: number;
      }>(
        [
          {
            $sort: { hour: -1, diseasePhase: -1 },
          },
          {
            $group: {
              _id: { hour: '$hour', diseasePhase: '$diseasePhase' },
              value: { $count: {} },
            },
          },
        ],
        { allowDiskUse: true }
      )
      .toArray();

    const hourObject = stats.reduce<Record<string, StatsHourResponse>>(
      (acc, curr) => ({
        ...acc,
        [curr._id.hour]: {
          ...(acc[curr._id.hour] ?? {}),
          [curr._id.diseasePhase]: curr.value,
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
