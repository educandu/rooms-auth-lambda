import { SESSION_COOKIE_NAME, X_ROOMS_AUTH_SECRET } from './config.js';
import { getDocumentInputAccessAuthorizationEndpointUrl, getMediaTrashAccessAuthorizationEndpointUrl, getRoomAccessAuthorizationEndpointUrl } from './urls.js';

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

  callMediaTrashAccessAuthEndpoint(sessionCookie) {
    return fetch(getMediaTrashAccessAuthorizationEndpointUrl(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}`,
        'x-rooms-auth-secret': X_ROOMS_AUTH_SECRET
      }
    });
  }
}
