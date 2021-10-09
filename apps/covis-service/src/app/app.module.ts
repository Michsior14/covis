import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { GeolocationController } from './geolocation';

@Module({
  imports: [],
  controllers: [AppController, GeolocationController],
  providers: [],
})
export class AppModule {}
