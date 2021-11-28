import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { AreaRequest, LocationEntity, Page } from './location.entity';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @ApiResponse({ type: LocationEntity, isArray: true, status: HttpStatus.OK })
  public async getAll(@Query() page: Page): Promise<LocationEntity[]> {
    return this.locationService.findAll(page);
  }

  @Get(':lats/:lngw/:latn/:lnge/:zoom/:hour')
  @ApiResponse({ type: LocationEntity, isArray: true, status: HttpStatus.OK })
  public async getAllHour(
    @Param() area: AreaRequest,
    @Query() page: Page
  ): Promise<LocationEntity[]> {
    return this.locationService.findAllInArea(area, page);
  }
}
