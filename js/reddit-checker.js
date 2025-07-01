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
     * Checks the status of a single Reddit username.
     * @param {string} username - The Reddit username to check.
     * @returns {Promise<{username: string, status: 'good' | 'bad'}>}
     */
    const checkUserStatus = async (username) => {
        try {
            // Using our own serverless function proxy to call the Reddit API.
            const response = await fetch(`/check-reddit?username=${username}`);

            if (response.ok) {
                const data = await response.json();
                // A valid user object ('t2') means the account is active.
                if (data && data.kind === 't2') {
                    // Check for suspended accounts, which still return a t2 object but have a 'is_suspended' flag.
                    if (data.data && data.data.is_suspended) {
                        return { username, status: 'bad' }; // Suspended account
                    }
                    return { username, status: 'good' };
                }
                 // If the response is OK but doesn't contain a valid user, treat as bad.
                return { username, status: 'bad' };
            } else if (response.status === 404) {
                 // 404 means the user is either shadowbanned or doesn't exist.
                return { username, status: 'bad' };
            } else {
                 // Any other server error.
                return { username, status: 'bad' };
            }
        } catch (error) {
            // Network errors, etc.
            console.error(`Error checking ${username}:`, error);
            return { username, status: 'bad' };
        }
    };

    /**
     * Main function to process all usernames.
     */
    const handleAccountCheck = async () => {
        const usernames = usernamesInput.value
            .split('\n')
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (usernames.length === 0) {
            return;
        }

        // --- UI Updates: Start Loading ---
        loadingSpinner.classList.remove('hidden');
        resultsArea.classList.add('hidden');
        goodAccountsArea.value = '';
        badAccountsArea.value = '';

        const checkPromises = usernames.map(checkUserStatus);
        const results = await Promise.allSettled(checkPromises);

        const goodAccounts = [];
        const badAccounts = [];

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                if (result.value.status === 'good') {
                    goodAccounts.push(result.value.username);
                } else {
                    badAccounts.push(result.value.username);
                }
            } else {
                 // Handle cases where the promise itself was rejected, though our catch block should prevent this.
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
            // Fallback for older browsers could be added here if needed
        });
    };

    // --- Event Listeners ---
    checkButton.addEventListener('click', handleAccountCheck);
    copyGoodButton.addEventListener('click', () => copyToClipboard(goodAccountsArea, copyGoodButton));
    copyBadButton.addEventListener('click', () => copyToClipboard(badAccountsArea, copyBadButton));
}); 