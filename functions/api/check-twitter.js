// This Cloudflare Function acts as a secure proxy to the Twitter API v2.
// It checks a user's status by their username.

export async function onRequest(context) {
  // 1. Get the Bearer Token from secure environment variables
  const BEARER_TOKEN = context.env.TWITTER_BEARER_TOKEN;
  if (!BEARER_TOKEN) {
    return new Response(JSON.stringify({ status: 'error', message: 'Twitter API Bearer Token is not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Get the username from the request query
  const url = new URL(context.request.url);
  const username = url.searchParams.get('username');
  if (!username) {
    return new Response(JSON.stringify({ status: 'error', message: 'Missing username parameter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Call the Twitter API v2
  const apiUrl = `https://api.twitter.com/2/users/by/username/${username}`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
    });

    // Before trying to parse JSON, check if the request was successful
    if (!response.ok) {
        // Twitter API returned an error (e.g., 401 Unauthorized, 400 Bad Request)
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from Twitter API.' }));
        const detail = errorData.detail || `Status code: ${response.status}`;
        return new Response(JSON.stringify({ status: 'error', message: `Twitter API Error: ${detail}` }), {
            status: 200, // Return 200 so the frontend can parse this error message
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const data = await response.json();

    // 4. Interpret the response
    // If the 'data' object exists, the user is active.
    if (data.data) {
      return new Response(JSON.stringify({ status: 'active' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } 
    // If the 'errors' object exists, the user is suspended, deactivated, or not found.
    else if (data.errors) {
      return new Response(JSON.stringify({ status: 'terminated' }), {
        status: 200, // Still 200, status is in the payload
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Handle any other unexpected API response format.
    else {
        return new Response(JSON.stringify({ status: 'terminated', message: 'Unexpected API response' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    return new Response(JSON.stringify({ status: 'error', message: `An error occurred: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 