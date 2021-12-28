import { Logger, ShutdownSignal, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { setupDocs } from './app/docs';

const globalPrefix = 'api';
const port = process.env.PORT || 3000;

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix(globalPrefix);

  // Attach docs route
  await setupDocs(app);

  /**
   * Graceful service stop
   * e.g. shutdown database connections, ...
   *
   * @see http://pm2.keymetrics.io/docs/usage/signals-clean-restart/#graceful-stop
   */
  app.enableShutdownHooks([ShutdownSignal.SIGINT]);

  await app.listen(port, () =>
    Logger.log(`Listening at http://localhost:${port}/${globalPrefix}`)
  );
};

void bootstrap();
