import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from './location.controller';
import { LocationEntity } from './location.entity';
import { LocationService } from './location.service';

@Module({
  imports: [TypeOrmModule.forFeature([LocationEntity])],
  providers: [LocationService],
  controllers: [LocationController],
})
export class LocationModule {}
