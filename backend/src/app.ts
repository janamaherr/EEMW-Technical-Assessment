import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { router } from './routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
