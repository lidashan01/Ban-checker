// This function acts as a proxy for multiple Roblox APIs to avoid CORS issues.
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const endpoint = url.searchParams.get('endpoint');
  const userId = url.searchParams.get('userId');

  let targetUrl;
  let robloxRequest;

  // We determine which Roblox API to call based on the 'endpoint' parameter
  switch (endpoint) {
    case 'getUserId':
      targetUrl = 'https://users.roblox.com/v1/usernames/users';
      // This is a POST request, so we pass the body from the original request
      if (request.method !== 'POST') {
        return new Response('Expected POST for getUserId endpoint', { status: 405 });
      }
      robloxRequest = new Request(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: request.body,
      });
      break;

    case 'getProfile':
      if (!userId) return new Response('Missing userId for getProfile', { status: 400 });
      targetUrl = `https://users.roblox.com/v1/users/${userId}`;
      robloxRequest = new Request(targetUrl, {
        headers: { 'Accept': 'application/json' }
      });
      break;

    case 'getFriends':
      if (!userId) return new Response('Missing userId for getFriends', { status: 400 });
      targetUrl = `https://friends.roblox.com/v1/users/${userId}/friends`;
      robloxRequest = new Request(targetUrl, {
        headers: { 'Accept': 'application/json' }
      });
      break;

    default:
      return new Response('Invalid endpoint specified', { status: 400 });
  }

  try {
    const response = await fetch(robloxRequest);
    // Re-create the response to ensure correct CORS headers are set by Cloudflare
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    return new Response(`Error fetching from Roblox API: ${error.message}`, { status: 500 });
  }
} 