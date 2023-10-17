import { WEBSITE_BASE_URL } from './config.js';

export function getLoginPageUrl(redirect) {
  return `${WEBSITE_BASE_URL}/login?redirect=${encodeURIComponent(redirect)}`;
}

export function getRoomAccessAuthorizationEndpointUrl(roomId) {
  return `${WEBSITE_BASE_URL}/api/v1/rooms/${encodeURIComponent(roomId)}/authorize-resources-access`;
}

export function getDocumentInputAccessAuthorizationEndpointUrl(documentInputId) {
  return `${WEBSITE_BASE_URL}/api/v1/doc-inputs/${encodeURIComponent(documentInputId)}/authorize-resources-access`;
}
