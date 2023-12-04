import { handler } from './index.js';
import { promisify } from 'node:util';
import { assert, createSandbox } from 'sinon';
import WebsiteApiClient from './website-api-client.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SESSION_COOKIE_VALUE = 's%3AIMb28VLUKex1w166';

function createLambdaEvent({ host = 'localhost:10000', method = 'GET', uri = '/room-media/abc/my-image.png', cookie = `SESSION_ID=${SESSION_COOKIE_VALUE}` }) {
  return {
    Records: [
      {
        cf: {
          request: {
            method,
            uri,
            headers: {
              host: host ? [{ key: 'Host', value: host }] : null,
              cookie: cookie ? [{ key: 'Cookie', value: cookie }] : null
            }
          }
        }
      }
    ]
  };
}

describe('index', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.stub(WebsiteApiClient.prototype, 'callRoomAccessAuthEndpoint');
    sandbox.stub(WebsiteApiClient.prototype, 'callDocumentInputAccessAuthEndpoint');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handler', () => {
    const promisifiedHandler = promisify(handler);

    describe('when method is other than GET or HEAD', () => {
      it('should respond with status code 500', async () => {
        const result = await promisifiedHandler(createLambdaEvent({ method: 'POST' }), {});
        expect(result.status).toBe('500');
      });
    });

    describe('when there is no cookie set in the headers', () => {
      it('should respond with status code 302', async () => {
        const result = await promisifiedHandler(createLambdaEvent({ cookie: null }), {});
        expect(result.status).toBe('302');
      });
      it('should respond with the website\'s login page url in the location header with a redirect query param', async () => {
        const result = await promisifiedHandler(createLambdaEvent({ cookie: null }), {});
        expect(result.headers?.location?.[0]?.value).toBe('http://localhost:3000/login?redirect=http%3A%2F%2Flocalhost%3A10000%2Froom-media%2Fabc%2Fmy-image.png');
      });
    });

    describe('when the URL does not match any of the required patterns', () => {
      it('should respond with status code 404', async () => {
        const result = await promisifiedHandler(createLambdaEvent({ uri: '/chambers/123/some-file.png' }), {});
        expect(result.status).toBe('404');
      });
    });

    describe('when the URL matches the room media pattern', () => {
      beforeEach(() => {
        WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.resolves({ status: 200 });
      });
      it('should call the room media authorization endpoint', async () => {
        await promisifiedHandler(createLambdaEvent({ uri: '/room-media/abc/my-image.png' }), {});
        assert.calledOnceWithExactly(WebsiteApiClient.prototype.callRoomAccessAuthEndpoint, 'abc', SESSION_COOKIE_VALUE);
      });
    });

    describe('when the URL matches the document input media pattern', () => {
      beforeEach(() => {
        WebsiteApiClient.prototype.callDocumentInputAccessAuthEndpoint.resolves({ status: 200 });
      });
      it('should call the document input media authorization endpoint', async () => {
        await promisifiedHandler(createLambdaEvent({ uri: '/document-input-media/xyz/abc/my-image.png' }), {});
        assert.calledOnceWithExactly(WebsiteApiClient.prototype.callDocumentInputAccessAuthEndpoint, 'abc', SESSION_COOKIE_VALUE);
      });
    });

    describe('when the verification call to the website fails', () => {
      beforeEach(() => {
        WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.rejects(new Error());
      });
      it('should respond with status code 500', async () => {
        const result = await promisifiedHandler(createLambdaEvent({}), {});
        expect(result.status).toBe('500');
      });
    });

    describe('when the verification call to the website succeeds', () => {
      describe('and the response code of the verification call is 200', () => {
        beforeEach(() => {
          WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.resolves({ status: 200 });
        });
        it('should respond with the initial request value', async () => {
          const event = createLambdaEvent({});
          const result = await promisifiedHandler(event, {});
          expect(result).toBe(event.Records[0].cf.request);
        });
      });

      describe('and the response code of the verification call is 401', () => {
        beforeEach(() => {
          WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.resolves({ status: 401 });
        });
        it('should respond with status code 302', async () => {
          const result = await promisifiedHandler(createLambdaEvent({}), {});
          expect(result.status).toBe('302');
        });
        it('should respond with the website\'s login page url in the location header with a redirect query param', async () => {
          const result = await promisifiedHandler(createLambdaEvent({}), {});
          expect(result.headers?.location?.[0]?.value).toBe('http://localhost:3000/login?redirect=http%3A%2F%2Flocalhost%3A10000%2Froom-media%2Fabc%2Fmy-image.png');
        });
      });

      describe('and the response code of the verification call is 403', () => {
        beforeEach(() => {
          WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.resolves({ status: 403 });
        });
        it('should respond with status code 403', async () => {
          const result = await promisifiedHandler(createLambdaEvent({}), {});
          expect(result.status).toBe('403');
        });
      });

      describe('and the response code of the verification call is any other value', () => {
        beforeEach(() => {
          WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.resolves({ status: 503 });
        });
        it('should respond with status code 500', async () => {
          const result = await promisifiedHandler(createLambdaEvent({}), {});
          expect(result.status).toBe('500');
        });
      });
    });

  });
});
