document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const usernamesInput = document.getElementById('usernames-input');
    const checkButton = document.getElementById('check-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsArea = document.getElementById('results-area');
    const goodAccountsArea = document.getElementById('good-accounts');
    const badAccountsArea = document.getElementById('bad-accounts');
    const copyGoodButton = document.getElementById('copy-good-button');
    const copyBadButton = document.getElementById('copy-bad-button');

    // --- Core Checker Logic ---

    /**
     * Checks the status of a single YouTube Channel.
     * @param {string} channelIdentifier - The YouTube channel ID, handle, or URL fragment.
     * @returns {Promise<{identifier: string, status: 'good' | 'bad'}>}
     */
    const checkUserStatus = async (channelIdentifier) => {
        try {
            // Using our own serverless function proxy to call the YouTube API.
            const response = await fetch(`/api/check-youtube?channel=${encodeURIComponent(channelIdentifier)}`);

            if (response.ok) {
                const data = await response.json();
                // Our API returns a simple status. 'active' means good.
                if (data.status === 'active') {
                    return { identifier: channelIdentifier, status: 'good' };
                }
            }
            // Any other case (404, 500, or status not 'active') is considered bad.
            return { identifier: channelIdentifier, status: 'bad' };

        } catch (error) {
            // Network errors, etc.
            console.error(`Error checking ${channelIdentifier}:`, error);
            return { identifier: channelIdentifier, status: 'bad' };
        }
    };

    /**
     * Main function to process all usernames.
     */
    const handleAccountCheck = async () => {
        const identifiers = usernamesInput.value
            .split('\n')
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (identifiers.length === 0) {
            return;
        }

        // --- UI Updates: Start Loading ---
        loadingSpinner.classList.remove('hidden');
        resultsArea.classList.add('hidden');
        goodAccountsArea.value = '';
        badAccountsArea.value = '';

        const checkPromises = identifiers.map(checkUserStatus);
        const results = await Promise.allSettled(checkPromises);

        const goodAccounts = [];
        const badAccounts = [];

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                if (result.value.status === 'good') {
                    goodAccounts.push(result.value.identifier);
                } else {
                    badAccounts.push(result.value.identifier);
                }
            } else {
                 // Handle cases where the promise itself was rejected.
                 console.error('A check failed unexpectedly:', result.reason);
            }
        });

        // --- UI Updates: Display Results ---
        goodAccountsArea.value = goodAccounts.join('\n');
        badAccountsArea.value = badAccounts.join('\n');
        loadingSpinner.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    };

    // --- Clipboard Logic ---

    /**
     * Copies text from a textarea to the clipboard.
     * @param {HTMLTextAreaElement} textAreaElement - The textarea to copy from.
     * @param {HTMLButtonElement} buttonElement - The button that was clicked.
     */
    const copyToClipboard = (textAreaElement, buttonElement) => {
        if (!textAreaElement.value) return;

        navigator.clipboard.writeText(textAreaElement.value).then(() => {
            const originalText = buttonElement.innerText;
            buttonElement.innerText = 'Copied!';
            setTimeout(() => {
                buttonElement.innerText = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    // --- Event Listeners ---
    checkButton.addEventListener('click', handleAccountCheck);
    copyGoodButton.addEventListener('click', () => copyToClipboard(goodAccountsArea, copyGoodButton));
    copyBadButton.addEventListener('click', () => copyToClipboard(badAccountsArea, copyBadButton));
}); 