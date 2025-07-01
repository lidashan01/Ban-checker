// This function runs on Cloudflare's servers
export async function onRequest(context) {
  // 1. Get the username from the frontend request URL (e.g., /api/check-reddit?username=some_user)
  const url = new URL(context.request.url);
  const username = url.searchParams.get('username');

  if (!username) {
    return new Response('Missing username parameter', { status: 400 });
  }

  // 2. Fetch the actual Reddit API from the Cloudflare server
  // It's good practice to set a custom User-Agent
  const redditApiUrl = `https://www.reddit.com/user/${username}/about.json`;
  const headers = {
    'User-Agent': 'BanChecker.org Bot v1.0'
  };

  const response = await fetch(redditApiUrl, { headers });

  // 3. Return the response from Reddit directly to our frontend
  // We create a new response to ensure correct headers for CORS if needed in the future
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
        'Content-Type': 'application/json',
    }
  });

  return newResponse;
} 