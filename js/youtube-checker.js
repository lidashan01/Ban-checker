document.addEventListener('DOMContentLoaded', () => {
    const checkButton = document.getElementById('check-button');
    const usernameInput = document.getElementById('username-input');
    const goodAccountsTextarea = document.getElementById('good-accounts');
    const badAccountsTextarea = document.getElementById('bad-accounts');
    const resultsSection = document.getElementById('results-section');
    const resultsOutput = document.getElementById('results-output');
    const loader = document.getElementById('loader');

    /**
     * Extracts a usable channel identifier from various YouTube URL formats.
     * @param {string} input - The raw user input line.
     * @returns {string} A clean channel handle (@name), ID (UC...), or custom URL name.
     */
    const cleanYoutubeIdentifier = (input) => {
        try {
            // If it's a full URL, parse it to get the last significant part
            if (input.includes('youtube.com')) {
                const url = new URL(input);
                // Handle /c/ /user/ and /channel/ formats
                const pathParts = url.pathname.split('/').filter(p => p);
                if (pathParts.length > 1) {
                    return pathParts[1];
                }
                // Handle new /@handle format
                if (url.pathname.startsWith('/@')) {
                    return url.pathname.substring(1);
                }
            }
        } catch (e) {
            // Not a valid URL, just use the input as is
        }
        // Return the cleaned input, removing any query parameters
        return input.split('?')[0];
    };

    /**
     * Checks a single YouTube channel's status by calling our backend proxy.
     * @param {string} identifier - The cleaned channel identifier.
     * @returns {Promise<{identifier: string, status: 'good' | 'bad'}>}
     */
    const checkChannelStatus = async (identifier) => {
        try {
            // Our backend function expects the `channel` query parameter
            const response = await fetch(`/api/check-youtube?channel=${encodeURIComponent(identifier)}`);
            
            // The backend returns a clear "good" or "bad" status
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'good') {
                    return { identifier, status: 'good' };
                }
            }
            // Any non-ok response or a "bad" status means the channel is not active
            return { identifier, status: 'bad' };
        } catch (error) {
            console.error('Error checking channel:', identifier, error);
            return { identifier, status: 'bad' };
        }
    };

    checkButton.addEventListener('click', async () => {
        const usernames = usernameInput.value.split('\\n').map(u => u.trim()).filter(Boolean);
        if (usernames.length === 0) {
            return;
        }

        // 1. Show loader and hide previous results
        resultsSection.classList.remove('hidden');
        resultsOutput.classList.add('hidden');
        loader.classList.remove('hidden');
        goodAccountsTextarea.value = '';
        badAccountsTextarea.value = '';

        // 2. Process all channels concurrently
        const promises = usernames.map(username => {
            const identifier = cleanYoutubeIdentifier(username);
            return checkChannelStatus(identifier);
        });

        const results = await Promise.allSettled(promises);

        // 3. Hide loader and show results
        loader.classList.add('hidden');
        resultsOutput.classList.remove('hidden');

        // 4. Populate results textareas
        const goodAccounts = [];
        const badAccounts = [];

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { identifier, status } = result.value;
                if (status === 'good') {
                    goodAccounts.push(identifier);
                } else {
                    badAccounts.push(identifier);
                }
            } else {
                // Handle rejected promises if any (though our function is designed to always resolve)
                console.error('A promise was rejected:', result.reason);
            }
        });

        goodAccountsTextarea.value = goodAccounts.join('\\n');
        badAccountsTextarea.value = badAccounts.join('\\n');
    });
}); 