import phin from 'phin';
import { SESSION_COOKIE_NAME } from './config.js';
import { getVerificationEndpointUrl } from './urls.js';

export function callRoomAccessAuthEndpoint(roomId, sessionCookie) {
  return phin({
    url: getVerificationEndpointUrl(roomId),
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}`
    }
  });
}
