/* eslint-disable no-console, no-process-env */

import cors from 'cors';
import express from 'express';
import httpProxy from 'http-proxy';
import Graceful from 'node-graceful';
import { handler } from './index.js';
import { inspect, promisify } from 'util';
import { cleanEnv, port, url } from 'envalid';

Graceful.captureExceptions = true;
Graceful.captureRejections = true;

const { PORT, CDN_BASE_URL } = cleanEnv(process.env, {
  PORT: port({ default: 10000 }),
  CDN_BASE_URL: url({ default: 'http://localhost:9001/dev-educandu-cdn' })
});

const proxy = httpProxy.createProxyServer({ target: CDN_BASE_URL });

async function lambdaEdgeMiddleware(req, res, next) {
  if ((/^\/rooms\/.+$/).test(req.url)) {
    console.log('Sending request to Lambda@Edge');
    try {
      const expressCookie = req.get('cookie');
      const lambdaRequest = {
        method: req.method,
        uri: req.url,
        headers: expressCookie ? { cookie: [{ key: 'Cookie', value: expressCookie }] } : {}
      };
      const event = { Records: [{ cf: { request: lambdaRequest } }] };
      const result = await promisify(handler)(event, {});
      if (result !== lambdaRequest) {
        const headers = Object.values(result.headers || {}).flat();
        headers.forEach(({ key, value }) => {
          res.set(key, value);
        });

        return res.status(result.status).send(result.statusDescription);
      }
    } catch (err) {
      return next(err);
    }
  }

  console.log(`Proxy request ${req.url} to ${CDN_BASE_URL}`);
  return proxy.web(req, res);
}

// eslint-disable-next-line no-unused-vars
function errorMiddleware(error, _req, res, _next) {
  return res.status(500).send(inspect(error));
}

let server = express()
  .use(cors())
  .use(lambdaEdgeMiddleware)
  .use(errorMiddleware)
  .listen(PORT, err => {
    if (err) {
      console.error(err);
      server = null;
    } else {
      console.log(`Lambda@Edge running on port ${PORT}`);
    }
  });

Graceful.on('exit', () => {
  console.log('Shutting down Lambda@Edge');
  return server ? promisify(server.close)() : Promise.resolve();
});
