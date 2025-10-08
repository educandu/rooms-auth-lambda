import { parseCookie } from './cookie-helper.js';
import { SESSION_COOKIE_NAME } from './config.js';

export const REQUEST_TYPE = {
  roomMedia: 'roomMedia',
  documentInputMedia: 'documentInputMedia',
  mediaTrash: 'mediaTrash',
  unknown: 'unknown'
};

export function analyzeRequest(request) {
  const sessionCookie = parseCookie(request.headers, SESSION_COOKIE_NAME);

  const roomMediaRoomId = ((/^\/room-media\/([^/]+)\/.+$/).exec(request.uri) || [])[1];
  if (roomMediaRoomId) {
    return { requestType: REQUEST_TYPE.roomMedia, roomId: roomMediaRoomId, documentInputId: null, sessionCookie };
  }

  const [documentInputMediaRoomId, documentInputId] = ((/^\/document-input-media\/([^/]+)\/([^/]+)\/.+$/).exec(request.uri) || []).slice(1, 3);
  if (documentInputMediaRoomId && documentInputId) {
    return { requestType: REQUEST_TYPE.documentInputMedia, roomId: documentInputMediaRoomId, documentInputId, sessionCookie };
  }

  if ((/^\/media-trash\/.+$/).test(request.uri)) {
    return { requestType: REQUEST_TYPE.mediaTrash, roomId: null, documentInputId: null, sessionCookie };
  }

  return { requestType: REQUEST_TYPE.unknown, roomId: null, documentInputId: null, sessionCookie };
}
