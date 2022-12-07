import phin from 'phin';
import { SESSION_COOKIE_NAME } from './config.js';
import { getVerificationEndpointUrl } from './urls.js';

// Until Lambda@Edge supports node v18.x we have to polyfill native global `fetch`:
globalThis.fetch ??= async function fetch(url, options) {
  const response = await phin({ url, ...options });
  return { status: response.statusCode };
};

export default class WebsiteApiClient {
  callRoomAccessAuthEndpoint(roomId, sessionCookie) {
    return fetch(getVerificationEndpointUrl(roomId), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}`
      }
    });
  }
}
