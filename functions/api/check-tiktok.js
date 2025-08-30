// This is a Cloudflare Pages Function that acts as a proxy to check TikTok user status.
// It will be accessible at /api/check-tiktok

export async function onRequest(context) {
    // 1. Get username from the request URL
    const url = new URL(context.request.url);
    const username = url.searchParams.get('username');

    if (!username || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
        return new Response(JSON.stringify({
            status: 'error',
            reason: 'A valid username is required.'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 2. Set a realistic User-Agent to avoid being blocked by TikTok
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        'DNT': '1', // Do Not Track
        'Upgrade-Insecure-Requests': '1',
    };

    try {
        // 3. Fetch the public TikTok profile page
        const response = await fetch(`https://www.tiktok.com/@${username}`, { headers });
        const responseText = await response.text();

        // 4. Determine account status based on response
        let profileStatus;

        if (response.status === 200) {
            // Check content to see if the account is private
            if (responseText.includes('"isPrivateAccount":true') || responseText.includes("This account is private")) {
                profileStatus = 'private'; // Account exists but is private
            } else {
                profileStatus = 'active'; // Account is public and active
            }
        } else if (response.status === 404) {
            profileStatus = 'banned_or_does_not_exist'; // Account is banned, suspended, or simply doesn't exist.
        } else {
             // Handle other unexpected HTTP statuses (e.g., 5xx errors from TikTok)
            profileStatus = 'error';
        }

        // 5. Return a structured JSON response
        return new Response(JSON.stringify({ status: profileStatus, username: username }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(`Error fetching TikTok profile for ${username}:`, error);
        return new Response(JSON.stringify({ status: 'error', reason: 'An unexpected server error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 