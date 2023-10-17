import { inspect } from 'node:util';
import { logger } from './logging.js';
import { parseCookie } from './cookie-helper.js';
import { SESSION_COOKIE_NAME } from './config.js';
import WebsiteApiClient from './website-api-client.js';
import { forbiddenResponse, internalServerErrorResponse, loginRedirectResponse, notFoundResponse } from './response-helper.js';

const websiteApiClient = new WebsiteApiClient();

export async function handler(event, _context, callback) {
  const request = event.Records[0].cf.request;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // This should never happen, only GET and HEAD should be allowed in CloudFront configuration
    // In case of misconfiguration we respond with 500 to any non read-request
    return callback(null, internalServerErrorResponse());
  }

  let roomId;
  let documentInputId;
  roomId = ((/^\/room-media\/([^/]+)\/.+$/).exec(request.uri) || [])[1];
  if (roomId) {
    documentInputId = null;
  } else {
    [roomId, documentInputId] = ((/^\/document-input-media\/([^/]+)\/([^/]+)\/.+$/).exec(request.uri) || []).slice(1, 3);
  }

  if (!roomId) {
    // Request path does not match any of the required patterns -> 404
    return callback(null, notFoundResponse());
  }

  const sessionCookie = parseCookie(request.headers, SESSION_COOKIE_NAME);
  if (!sessionCookie) {
    // If there is no cookie, we redirect to the login page, so the user can login and then be redirected back to the room resource
    return callback(null, loginRedirectResponse(request));
  }

  let verificationResponse;
  try {
    verificationResponse = documentInputId
      ? await websiteApiClient.callDocumentInputAccessAuthEndpoint(documentInputId, sessionCookie)
      : await websiteApiClient.callRoomAccessAuthEndpoint(roomId, sessionCookie);
  } catch (err) {
    logger.error(inspect(err));
    return callback(null, internalServerErrorResponse());
  }

  switch (verificationResponse.status) {
    case 200:
      // User is allowed to proceed, we return the original request
      return callback(null, request);
    case 401:
      // Unauthorized (in case the cookie is there but the session has already expired, re-login is required)
      return callback(null, loginRedirectResponse(request));
    case 403:
      // Forbidden (cookie is there but room access is denied)
      return callback(null, forbiddenResponse());
    default:
      // In all other cases we just return status 500
      return callback(null, internalServerErrorResponse());
  }
}
