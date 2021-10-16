import { Module } from '@nestjs/common';
import { FileService } from './file/file.service';

@Module({
  controllers: [],
  providers: [FileService],
  exports: [FileService],
})
export class SharedModule {}
