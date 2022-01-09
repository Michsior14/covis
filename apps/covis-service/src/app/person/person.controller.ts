import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { PersonEntity } from './person.entity';
import { PersonService } from './person.service';

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get()
  @ApiResponse({ type: PersonEntity, isArray: true, status: HttpStatus.OK })
  public getAll(): Promise<PersonEntity[]> {
    return this.personService.findAll();
  }

  @Get(':id')
  @ApiResponse({ type: PersonEntity, status: HttpStatus.OK })
  public get(@Param('id') id: string): Promise<PersonEntity | undefined> {
    return this.personService.findOne(id);
  }
}
