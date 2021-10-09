import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get()
  @ApiOperation({ operationId: 'Health check' })
  public healthCheck(): { message: string } {
    return { message: 'Service is working.' };
  }
}
