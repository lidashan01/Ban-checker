// This is a Cloudflare Pages Function.
// It will be accessible at /api/check-steam

export async function onRequest(context) {
    // IMPORTANT: Replace this with your actual Steam Web API key.
    // The best practice is to store it as a secret environment variable in your Cloudflare project settings.
    // Go to your Cloudflare dashboard -> Workers & Pages -> Your Project -> Settings -> Environment Variables.
    const STEAM_API_KEY = context.env.STEAM_API_KEY || 'YOUR_STEAM_API_KEY_HERE';

    // Get the user input from the query string.
    const url = new URL(context.request.url);
    const userInput = url.searchParams.get('user_input');

    if (!userInput) {
        return new Response(JSON.stringify({ error: 'User input is required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        let steamId = userInput;

        // Step 1: Check if the input is a vanity URL or a raw 64-bit ID.
        // A simple check: if it's not all digits, assume it's a vanity URL.
        if (isNaN(userInput) || userInput.length < 17) {
            // It's likely a vanity URL, let's resolve it.
            const vanityUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${userInput}`;
            const vanityResponse = await fetch(vanityUrl);
            const vanityData = await vanityResponse.json();

            if (vanityData.response && vanityData.response.success === 1) {
                steamId = vanityData.response.steamid;
            } else {
                // If resolving fails, the user might not exist or the input is invalid.
                return new Response(JSON.stringify({ status: 'bad', reason: 'User not found or invalid vanity URL' }), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        // Step 2: Now that we have a Steam ID, get the player bans.
        const bansUrl = `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${STEAM_API_KEY}&steamids=${steamId}`;
        const bansResponse = await fetch(bansUrl);
        const bansData = await bansResponse.json();

        if (bansData.players && bansData.players.length > 0) {
            const player = bansData.players[0];
            const isBanned = player.VACBanned || player.CommunityBanned || player.NumberOfGameBans > 0;
            
            // Return a structured response.
            const result = {
                steamId: player.SteamId,
                communityBanned: player.CommunityBanned,
                vacBanned: player.VACBanned,
                numberOfVACBans: player.NumberOfVACBans,
                daysSinceLastBan: player.DaysSinceLastBan,
                numberOfGameBans: player.NumberOfGameBans,
                economyBan: player.EconomyBan,
                status: isBanned ? 'bad' : 'good'
            };

            return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' },
            });

        } else {
            return new Response(JSON.stringify({ status: 'bad', reason: 'Could not retrieve ban status for the user.' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

    } catch (error) {
        console.error('Error fetching Steam API:', error);
        return new Response(JSON.stringify({ error: 'Failed to connect to Steam API.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 