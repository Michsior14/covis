import { Controller, Get, Param } from '@nestjs/common';

@Controller('geo')
export class GeolocationController {
  @Get(':x/:y/:z')
  public get(
    @Param('x') x: string,
    @Param('x') y: string,
    @Param('z') z: string
  ) {
    return {
      cordinates: [x, y, z],
    };
  }
}
