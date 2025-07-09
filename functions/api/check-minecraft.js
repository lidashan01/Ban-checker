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
        // Use the Ashcon.app API proxy, which is more reliable for server-side requests.
        const ashconResponse = await fetch(`https://api.ashcon.app/mojang/v2/user/${username}`);

        if (!ashconResponse.ok) {
            // If Ashcon returns a non-200 status, it means the user was not found or there was an error.
            const errorData = await ashconResponse.json();
            return new Response(JSON.stringify({ status: 'bad', reason: errorData.error || 'User not found' }), {
                status: ashconResponse.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const data = await ashconResponse.json();

        // Assemble the profile data from the Ashcon response.
        const profile = {
            status: 'good',
            username: data.username,
            uuid: data.uuid,
            name_history: data.username_history.map(item => ({
                name: item.username,
                changedToAt: item.changed_at || 'Original Name'
            })),
        };

        return new Response(JSON.stringify(profile), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error fetching Minecraft API via proxy:', error);
        return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 