// This is a Cloudflare Pages Function.
// It will be accessible at /api/check-minecraft

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const username = url.searchParams.get('username');

    if (!username) {
        return new Response(JSON.stringify({ error: 'Username is required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // Step 1: Get the player's UUID from their username.
        const uuidResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        
        if (uuidResponse.status === 204 || !uuidResponse.ok) {
            // 204 No Content means the user was not found.
            return new Response(JSON.stringify({ status: 'bad', reason: 'User not found' }), {
                status: 404, // Use 404 to indicate not found
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const uuidData = await uuidResponse.json();
        const playerUUID = uuidData.id;
        const currentName = uuidData.name; // Get the correctly capitalized name

        // Step 2: Get the player's name history using their UUID.
        const nameHistoryResponse = await fetch(`https://api.mojang.com/user/profiles/${playerUUID}/names`);
        const nameHistoryData = await nameHistoryResponse.json();

        // Step 3: Assemble the complete profile data.
        const profile = {
            status: 'good',
            username: currentName,
            uuid: playerUUID,
            name_history: nameHistoryData.map(item => ({
                name: item.name,
                changedToAt: item.changedToAt || 'Original Name' // Handle the first name case
            })).reverse(), // Show oldest first
            // We can construct avatar URLs on the frontend, but providing them here is also an option.
            // For this implementation, we'll let the frontend handle it to keep the API focused.
        };

        return new Response(JSON.stringify(profile), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error fetching Minecraft API:', error);
        return new Response(JSON.stringify({ error: 'Failed to connect to Minecraft API.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 