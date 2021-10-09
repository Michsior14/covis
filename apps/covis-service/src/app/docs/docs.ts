import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedocModule, RedocOptions } from 'nestjs-redoc';

export const setupDocs = async (app: INestApplication): Promise<void> => {
  const title = 'Covis Service';

  const options = new DocumentBuilder().setTitle(title).build();

  const redocOptions: RedocOptions = {
    title,
    expandResponses: '200,201',
  };

  const document = SwaggerModule.createDocument(app, options);
  return RedocModule.setup('/docs', app, document, redocOptions);
};
