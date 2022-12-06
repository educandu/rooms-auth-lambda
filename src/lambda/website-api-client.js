import { SESSION_COOKIE_NAME } from './config.js';
import { getVerificationEndpointUrl } from './urls.js';

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
