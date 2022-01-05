import sinon from 'sinon';
import { promisify } from 'util';
import { handler } from './index.js';
import WebsiteApiClient from './website-api-client.js';

function createLambdaEvent({ host = 'localhost:10000', method = 'GET', uri = '/rooms/abc/my-image.png', cookie = 'SESSION_ID=s%3AIMb28VLUKex1w166' }) {
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
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(WebsiteApiClient.prototype, 'callRoomAccessAuthEndpoint');
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

    describe('when the URL does not match the rooms pattern', () => {
      it('should respond with status code 404', async () => {
        const result = await promisifiedHandler(createLambdaEvent({ uri: '/chambers/123/some-file.png' }), {});
        expect(result.status).toBe('404');
      });
    });

    describe('when there is no cookie set in the headers', () => {
      it('should respond with status code 302', async () => {
        const result = await promisifiedHandler(createLambdaEvent({ cookie: null }), {});
        expect(result.status).toBe('302');
      });
      it('should respond with the website\'s login page url in the location header with a redirect query param', async () => {
        const result = await promisifiedHandler(createLambdaEvent({ cookie: null }), {});
        expect(result.headers?.location?.[0]?.value).toBe('http://localhost:3000/login?redirect=http%3A%2F%2Flocalhost%3A10000%2Frooms%2Fabc%2Fmy-image.png');
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
          WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.resolves({ statusCode: 200 });
        });
        it('should respond with the initial request value', async () => {
          const event = createLambdaEvent({});
          const result = await promisifiedHandler(event, {});
          expect(result).toBe(event.Records[0].cf.request);
        });
      });

      describe('and the response code of the verification call is 401', () => {
        beforeEach(() => {
          WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.resolves({ statusCode: 401 });
        });
        it('should respond with status code 302', async () => {
          const result = await promisifiedHandler(createLambdaEvent({}), {});
          expect(result.status).toBe('302');
        });
        it('should respond with the website\'s login page url in the location header with a redirect query param', async () => {
          const result = await promisifiedHandler(createLambdaEvent({}), {});
          expect(result.headers?.location?.[0]?.value).toBe('http://localhost:3000/login?redirect=http%3A%2F%2Flocalhost%3A10000%2Frooms%2Fabc%2Fmy-image.png');
        });
      });

      describe('and the response code of the verification call is 403', () => {
        beforeEach(() => {
          WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.resolves({ statusCode: 403 });
        });
        it('should respond with status code 403', async () => {
          const result = await promisifiedHandler(createLambdaEvent({}), {});
          expect(result.status).toBe('403');
        });
      });

      describe('and the response code of the verification call is any other value', () => {
        beforeEach(() => {
          WebsiteApiClient.prototype.callRoomAccessAuthEndpoint.resolves({ statusCode: 503 });
        });
        it('should respond with status code 500', async () => {
          const result = await promisifiedHandler(createLambdaEvent({}), {});
          expect(result.status).toBe('500');
        });
      });
    });

  });
});
