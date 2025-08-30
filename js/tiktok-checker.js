document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const usernamesInput = document.getElementById('usernames-input');
    const checkButton = document.getElementById('check-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsArea = document.getElementById('results-area');
    const goodAccountsTextarea = document.getElementById('good-accounts');
    const badAccountsTextarea = document.getElementById('bad-accounts');
    const copyGoodButton = document.getElementById('copy-good-button');
    const copyBadButton = document.getElementById('copy-bad-button');

    /**
     * Fetches account status from the serverless function.
     * @param {string} username - The TikTok username.
     * @returns {Promise<object>} - A promise that resolves to the account status object.
     */
    const checkUserStatus = async (username) => {
        try {
            const response = await fetch(`/api/check-tiktok?username=${encodeURIComponent(username)}`);
            if (!response.ok) {
                // If the function itself has an error, treat it as a bad result.
                return { status: 'error', username };
            }
            return await response.json();
        } catch (error) {
            console.error(`Error checking ${username}:`, error);
            return { status: 'error', username };
        }
    };

    /**
     * Main function to handle the account check button click.
     */
    const handleAccountCheck = async () => {
        const usernames = usernamesInput.value
            .split('\\n')
            .map(u => u.trim().replace(/^@/, '')) // Also remove @ if user adds it
            .filter(u => u.length > 0);

        if (usernames.length === 0) return;

        loadingSpinner.classList.remove('hidden');
        resultsArea.classList.add('hidden');
        goodAccountsTextarea.value = '';
        badAccountsTextarea.value = '';

        const checkPromises = usernames.map(checkUserStatus);
        const results = await Promise.allSettled(checkPromises);

        const goodA = [];
        const badA = [];

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { status, username } = result.value;
                // 'active' and 'private' are considered good results
                if (status === 'active' || status === 'private') {
                    goodA.push(username + (status === 'private' ? ' (Private)' : ''));
                } else {
                    badA.push(username);
                }
            } else {
                // Handle rejected promises or unexpected errors, though our catch block should prevent this.
                // For safety, we can try to find the username from the input array if the promise was rejected.
                // This part is complex, so we'll just log it for now.
                console.error('A promise was rejected:', result.reason);
            }
        });

        goodAccountsTextarea.value = goodA.join('\\n');
        badAccountsTextarea.value = badA.join('\\n');

        loadingSpinner.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    };

    /**
     * Copies text from a textarea to the clipboard.
     * @param {HTMLTextAreaElement} textarea - The textarea element to copy from.
     * @param {HTMLButtonElement} button - The button that was clicked.
     */
    const copyToClipboard = (textarea, button) => {
        if (!textarea.value) return;
        navigator.clipboard.writeText(textarea.value).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    // --- Event Listeners ---
    if (checkButton) {
        checkButton.addEventListener('click', handleAccountCheck);
    }
    if (copyGoodButton) {
        copyGoodButton.addEventListener('click', () => copyToClipboard(goodAccountsTextarea, copyGoodButton));
    }
    if (copyBadButton) {
        copyBadButton.addEventListener('click', () => copyToClipboard(badAccountsTextarea, copyBadButton));
    }
}); 