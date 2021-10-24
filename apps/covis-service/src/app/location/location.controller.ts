import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { pipeline } from 'stream';
import { LocationEntity, LocationGetAllQuery } from './location.entity';
import { LocationService } from './location.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const JsonStreamStringify = require('json-stream-stringify');

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  public get(
    @Query() { from, to }: LocationGetAllQuery
  ): Promise<LocationEntity[]> {
    return this.locationService.findAll(from, to);
  }

  @Get('stream')
  @ApiResponse({ type: LocationEntity, isArray: true, status: HttpStatus.OK })
  public async getStream(
    @Query() { from, to }: LocationGetAllQuery,
    @Res() res: Response
  ) {
    res.type('json');
    pipeline(
      new JsonStreamStringify(
        await this.locationService.findAllStream(from, to)
      ),
      res,
      (err) => {
        if (err) {
          throw err;
        }
      }
    );
  }
}
