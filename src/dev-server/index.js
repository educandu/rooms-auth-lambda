import cors from 'cors';
import express from 'express';
import { lambdaMiddleware, errorMiddleware } from './middlewares.js';

export function startDevServer(cdnBaseUrl, port, callback) {
  return express()
    .use(cors())
    .use(lambdaMiddleware(cdnBaseUrl))
    .use(errorMiddleware())
    .listen(port, callback);
}
