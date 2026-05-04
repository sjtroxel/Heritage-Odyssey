import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './services/logger.js';

const port = env.PORT;

app.listen(port, () => {
  logger.info(`🚀 Server ready at http://localhost:${port}`);
  logger.info(`🏥 Health check at http://localhost:${port}/health`);
});
