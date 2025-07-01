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
     * Checks the status of a single Twitter username.
     * @param {string} username - The Twitter username to check (without @).
     * @returns {Promise<{username: string, status: 'good' | 'bad'}>}
     */
    const checkUserStatus = async (username) => {
        const handle = username.startsWith('@') ? username.substring(1) : username;
        try {
            const response = await fetch(`/api/check-twitter?username=${handle}`);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'active') {
                    return { username, status: 'good' };
                }
            }
            return { username, status: 'bad' };
        } catch (error) {
            console.error(`Error checking ${username}:`, error);
            return { username, status: 'bad' };
        }
    };

    /**
     * Main function to process all usernames.
     */
    const handleAccountCheck = async () => {
        const usernames = usernamesInput.value
            .split('\\n')
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (usernames.length === 0) {
            return;
        }

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
                 console.error('A check failed unexpectedly:', result.reason);
            }
        });

        goodAccountsArea.value = goodAccounts.join('\\n');
        badAccountsArea.value = badAccounts.join('\\n');
        loadingSpinner.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    };

    /**
     * Copies text from a textarea to the clipboard.
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