export function parseCookie(headers, cookieName) {
  const parsedCookie = {};

  if (headers?.cookie?.length) {
    headers.cookie[0].value.split(';').forEach(cookie => {
      if (cookie) {
        const parts = cookie.split('=');
        parsedCookie[parts[0].trim()] = parts[1].trim();
      }
    });
  }

  return parsedCookie[cookieName];
}
