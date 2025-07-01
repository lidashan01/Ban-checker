// This Cloudflare Function acts as a secure proxy to the YouTube Data API v3.
// It handles different types of user inputs (handle, channel ID, URL) and
// uses the securely stored API key to check a channel's status.

export async function onRequest(context) {
  // 1. Get the API key from the secure environment variables
  const API_KEY = context.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return new Response('API key is not configured.', { status: 500 });
  }

  // 2. Get the user input from the request
  const url = new URL(context.request.url);
  const userInput = url.searchParams.get('channel');
  if (!userInput) {
    return new Response('Missing channel parameter.', { status: 400 });
  }

  // 3. Build the correct YouTube API URL based on the input type
  // The YouTube API requires different parameters for channel IDs vs. handles/custom URLs.
  // We make a best guess here. 'forUsername' works for legacy custom URLs and
  // 'forHandle' works for new @handle names. We will try 'forHandle' first.
  
  let apiUrl;
  let queryParam;
  
  // Extract handle, custom URL, or ID from a full YouTube URL
  const cleanedInput = userInput.split('/').pop().split('?')[0];

  if (cleanedInput.startsWith('@')) {
    // New @handle format
    queryParam = `forHandle=${cleanedInput.substring(1)}`;
  } else if (cleanedInput.startsWith('UC') || cleanedInput.startsWith('HC')) {
    // Standard Channel ID format
    queryParam = `id=${cleanedInput}`;
  } else {
    // Assume it's a legacy custom URL name (e.g., "PewDiePie")
    queryParam = `forUsername=${cleanedInput}`;
  }
  
  apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&${queryParam}&key=${API_KEY}`;
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // 4. Interpret the API response
    // If the API returns any items, the channel exists.
    if (data.items && data.items.length > 0) {
      return new Response(JSON.stringify({ status: 'good' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // If no items are returned, the channel is banned, deleted, or never existed.
      // We will try the other endpoint for legacy usernames if the handle lookup failed.
      if (queryParam.startsWith('forHandle=')) {
        const legacyApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${cleanedInput.substring(1)}&key=${API_KEY}`;
        const legacyResponse = await fetch(legacyApiUrl);
        const legacyData = await legacyResponse.json();
        if (legacyData.items && legacyData.items.length > 0) {
           return new Response(JSON.stringify({ status: 'good' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({ status: 'bad' }), {
        status: 404, // Use 404 to indicate not found
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(`An error occurred: ${error.message}`, { status: 500 });
  }
} 