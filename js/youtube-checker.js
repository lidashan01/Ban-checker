document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (using the same IDs as reddit-checker for consistency) ---
    const usernamesInput = document.getElementById('usernames-input'); // Changed from 'username-input'
    const checkButton = document.getElementById('check-button');
    const loadingSpinner = document.getElementById('loading-spinner'); // Changed from 'loader'
    const resultsArea = document.getElementById('results-area');     // Changed from 'results-section'
    const goodAccountsArea = document.getElementById('good-accounts');
    const badAccountsArea = document.getElementById('bad-accounts');
    const copyGoodButton = document.getElementById('copy-good-button'); // Added
    const copyBadButton = document.getElementById('copy-bad-button');   // Added

    /**
     * Extracts a usable channel identifier from various YouTube URL formats.
     * @param {string} input - The raw user input line.
     * @returns {string} A clean channel handle (@name), ID (UC...), or custom URL name.
     */
    const cleanYoutubeIdentifier = (input) => {
        try {
            if (input.includes('youtube.com/')) {
                const url = new URL(input.startsWith('http') ? input : `https://${input}`);
                const pathParts = url.pathname.split('/').filter(p => p && p !== 'channel' && p !== 'user' && p !== 'c');
                if (pathParts.length > 0) {
                    return pathParts[pathParts.length - 1];
                }
            }
        } catch (e) { /* Fall through */ }
        return input.split('?')[0];
    };

    /**
     * Checks a single YouTube channel's status by calling our backend proxy.
     * @param {string} identifier - The cleaned channel identifier.
     * @returns {Promise<{identifier: string, status: 'good' | 'bad'}>}
     */
    const checkChannelStatus = async (identifier) => {
        const originalInput = identifier; // Keep original for display
        try {
            const cleanedId = cleanYoutubeIdentifier(identifier);
            const response = await fetch(`/api/check-youtube?channel=${encodeURIComponent(cleanedId)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'good') {
                    return { identifier: originalInput, status: 'good' };
                }
            }
            return { identifier: originalInput, status: 'bad' };
        } catch (error) {
            console.error('Error checking channel:', identifier, error);
            return { identifier: originalInput, status: 'bad' };
        }
    };

    /**
     * Main function to process all usernames.
     */
    const handleAccountCheck = async () => {
        const inputs = usernamesInput.value
            .split('\\n')
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (inputs.length === 0) return;

        loadingSpinner.classList.remove('hidden');
        resultsArea.classList.add('hidden');
        goodAccountsArea.value = '';
        badAccountsArea.value = '';

        const checkPromises = inputs.map(checkChannelStatus);
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
            }
        });

        goodAccountsArea.value = goodAccounts.join('\\n');
        badAccountsArea.value = badAccounts.join('\\n');
        loadingSpinner.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    };

    /**
     * Copies text from a textarea to the clipboard.
     * @param {HTMLTextAreaElement} textAreaElement - The textarea to copy from.
     * @param {HTMLButtonElement} buttonElement - The button that was clicked.
     */
    const copyToClipboard = (textAreaElement, buttonElement) => {
        if (!textAreaElement.value) return;
        navigator.clipboard.writeText(textAreaElement.value).then(() => {
            const originalText = buttonElement.innerHTML; // Use innerHTML to support icons
            buttonElement.innerHTML = 'Copied!';
            setTimeout(() => {
                buttonElement.innerHTML = originalText;
            }, 2000);
        }).catch(err => console.error('Failed to copy text: ', err));
    };

    // --- Event Listeners ---
    checkButton.addEventListener('click', handleAccountCheck);
    if(copyGoodButton) copyGoodButton.addEventListener('click', () => copyToClipboard(goodAccountsArea, copyGoodButton));
    if(copyBadButton) copyBadButton.addEventListener('click', () => copyToClipboard(badAccountsArea, copyBadButton));
}); 