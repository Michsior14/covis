import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PersonEntity } from './person.entity';
import { PersonService } from './person.service';

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get()
  @ApiOperation({ operationId: 'Get all persons' })
  @ApiResponse({ type: PersonEntity, isArray: true, status: HttpStatus.OK })
  public getAll(): Promise<PersonEntity[]> {
    return this.personService.findAll();
  }

  @Get(':id')
  @ApiOperation({ operationId: 'Get person by id' })
  @ApiResponse({ type: PersonEntity, status: HttpStatus.OK })
  public get(@Param('id') id: number): Promise<PersonEntity | null> {
    return this.personService.findOne(id);
  }
}
