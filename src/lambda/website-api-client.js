import phin from 'phin';
import { SESSION_COOKIE_NAME, X_ROOMS_AUTH_SECRET } from './config.js';
import { getDocumentInputAccessAuthorizationEndpointUrl, getRoomAccessAuthorizationEndpointUrl } from './urls.js';

// Until Lambda@Edge supports node v18.x we have to polyfill native global `fetch`:
globalThis.fetch ??= async function fetch(url, options) {
  const response = await phin({ url, ...options });
  return { status: response.statusCode };
};

export default class WebsiteApiClient {
  callRoomAccessAuthEndpoint(roomId, sessionCookie) {
    return fetch(getRoomAccessAuthorizationEndpointUrl(roomId), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}`,
        'x-rooms-auth-secret': X_ROOMS_AUTH_SECRET
      }
    });
  }

  callDocumentInputAccessAuthEndpoint(documentInputId, sessionCookie) {
    return fetch(getDocumentInputAccessAuthorizationEndpointUrl(documentInputId), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}`,
        'x-rooms-auth-secret': X_ROOMS_AUTH_SECRET
      }
    });
  }
}
