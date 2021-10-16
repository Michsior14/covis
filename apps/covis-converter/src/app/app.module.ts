import { SharedModule } from '@covis/shared-backend';
import { ConsoleLogger, Module } from '@nestjs/common';
import { AppService } from './app.service';

@Module({
  imports: [SharedModule],
  providers: [AppService, ConsoleLogger],
})
export class AppModule {}
