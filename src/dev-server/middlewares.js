import httpProxy from 'http-proxy';
import { handler } from '../lambda/index.js';
import { inspect, promisify } from 'node:util';

export function lambdaMiddleware(cdnBaseUrl) {
  const proxy = httpProxy.createProxyServer({ target: cdnBaseUrl });

  return async (req, res, next) => {
    if ((/^\/rooms\/.+$/).test(req.url)) {
      console.log('Sending request to Lambda@Edge');
      try {
        const cookie = req.get('cookie');
        const lambdaRequest = {
          method: req.method,
          uri: req.url,
          headers: {
            host: [{ key: 'Host', value: req.get('host') }],
            cookie: cookie ? [{ key: 'Cookie', value: cookie }] : null
          }
        };
        const event = { Records: [{ cf: { request: lambdaRequest } }] };
        const result = await promisify(handler)(event, {});
        if (result !== lambdaRequest) {
          const headers = Object.values(result.headers || {}).flat();
          headers.forEach(({ key, value }) => {
            res.set(key, value);
          });

          return res.status(Number(result.status)).send(result.statusDescription);
        }
      } catch (err) {
        return next(err);
      }
    }

    console.log(`Proxy request ${req.url} to ${cdnBaseUrl}`);
    return proxy.web(req, res);
  };
}

export function errorMiddleware() {
  // eslint-disable-next-line no-unused-vars
  return (error, _req, res, _next) => {
    return res.status(500).send(inspect(error));
  };
}
