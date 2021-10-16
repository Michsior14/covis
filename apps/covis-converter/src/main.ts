import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app/app.module';
import { AppService } from './app/app.service';
import { cwd } from 'process';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const root = cwd();
  const inFilesFolder = join(root, 'apps/covis-converter/src/assets');
  const outputFolder = join(root, 'apps/covis-service/src/assets');

  const service = app.get(AppService);
  await service.process({
    inputFile: join(inFilesFolder, '10mln.csv.gz'),
    outputFolder,
  });
  await app.close();
}

bootstrap();
