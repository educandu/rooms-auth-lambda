import Graceful from 'node-graceful';
import { promisify } from 'node:util';
import { startDevServer } from './index.js';
import { cleanEnv, port, url } from 'envalid';

Graceful.captureExceptions = true;
Graceful.captureRejections = true;

const { PORT, CDN_BASE_URL } = cleanEnv(process.env, {
  PORT: port({ default: 10000 }),
  CDN_BASE_URL: url({ default: 'http://localhost:9000/dev-educandu-cdn' })
});

let server = startDevServer(CDN_BASE_URL, PORT, err => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    server = null;
  } else {
    // eslint-disable-next-line no-console
    console.log(`Lambda@Edge dev server started on port ${PORT}`);
  }
});

Graceful.on('exit', () => {
  // eslint-disable-next-line no-console
  console.log('Shutting down Lambda@Edge dev server');
  return server ? promisify(server.close)() : Promise.resolve();
});
