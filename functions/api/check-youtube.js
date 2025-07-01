// This Cloudflare Function acts as a secure proxy to the YouTube Data API v3.
// It robustly checks for a channel's existence by trying multiple query methods.

export async function onRequest(context) {
  // 1. Get the API key from the secure environment variables
  const API_KEY = context.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ status: 'error', message: 'API key is not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Get the user input from the request
  const url = new URL(context.request.url);
  const userInput = url.searchParams.get('channel');
  if (!userInput) {
    return new Response(JSON.stringify({ status: 'error', message: 'Missing channel parameter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Define all possible ways to query the API for a given identifier.
  // We will try them in order: by ID, by @handle, and by legacy username.
  const cleanedInput = userInput.split('/').pop().split('?')[0];
  const handleName = cleanedInput.startsWith('@') ? cleanedInput.substring(1) : cleanedInput;

  const queryMethods = [
    `id=${cleanedInput}`,
    `forHandle=${handleName}`,
    `forUsername=${cleanedInput}`
  ];

  // 4. Try each query method until one succeeds.
  for (const queryParam of queryMethods) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&${queryParam}&key=${API_KEY}`;
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        // If the API returns any items, the channel exists and is active.
        if (data.items && data.items.length > 0) {
          // Success! Channel found.
          return new Response(JSON.stringify({ status: 'active' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      // If response is not ok, or no items were found, we just continue to the next method.
    } catch (error) {
      // Log the error but continue, in case another method works.
      console.error(`API call failed for ${queryParam}:`, error);
    }
  }

  // 5. If all methods have been tried and none found a channel, return 'terminated'.
  return new Response(JSON.stringify({ status: 'terminated' }), {
    status: 200, // Always return 200 OK, the status is in the JSON.
    headers: { 'Content-Type': 'application/json' },
  });
} 