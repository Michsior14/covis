import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AreaRequest,
  HourRangeResponse,
  LocationEntity,
  Page,
  StatsResponse,
} from './location.entity';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @ApiOperation({ operationId: 'Get all locations' })
  @ApiResponse({ type: LocationEntity, isArray: true, status: HttpStatus.OK })
  public getAll(@Query() page: Page): Promise<LocationEntity[]> {
    return this.locationService.findAll(page);
  }

  @Get(':lngw/:lats/:lnge/:latn/:zoom/:hour')
  @ApiOperation({
    operationId: 'Get all locations for given map area, zoom and hour',
  })
  @ApiResponse({ type: LocationEntity, isArray: true, status: HttpStatus.OK })
  public getAllHour(
    @Param() area: AreaRequest,
    @Query() page: Page
  ): Promise<LocationEntity[]> {
    return this.locationService.findAllInArea(area, page);
  }

  @Get('hour-range')
  @ApiOperation({ operationId: 'Get hour range of the simulation' })
  @ApiResponse({ type: HourRangeResponse, status: HttpStatus.OK })
  public getHourRange(): Promise<HourRangeResponse> {
    return this.locationService.getHourRange();
  }

  @Get('stats')
  @ApiOperation({ operationId: 'Get the stats' })
  @ApiResponse({ type: StatsResponse, status: HttpStatus.OK })
  public getHourStats(): Promise<StatsResponse> {
    return this.locationService.getStats();
  }
}
