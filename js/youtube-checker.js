document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (using the same IDs as reddit-checker for consistency) ---
    const usernameInput = document.getElementById('username-input');
    const checkButton = document.getElementById('check-button');
    const spinner = document.getElementById('spinner');
    const buttonText = document.getElementById('button-text');
    const resultsContainer = document.getElementById('results-container');
    const activeList = document.getElementById('active-list');
    const bannedList = document.getElementById('banned-list');
    const activeCount = document.getElementById('active-count');
    const bannedCount = document.getElementById('banned-count');
    const copyActiveButton = document.getElementById('copy-active-button');
    const copyBannedButton = document.getElementById('copy-banned-button');

    const toggleLoading = (isLoading) => {
        if (isLoading) {
            checkButton.disabled = true;
            spinner.classList.remove('hidden');
            buttonText.textContent = 'Checking...';
        } else {
            checkButton.disabled = false;
            spinner.classList.add('hidden');
            buttonText.textContent = 'Check Accounts';
        }
    };

    const copyToClipboard = (element, button) => {
        if (!element.value) return;
        navigator.clipboard.writeText(element.value).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    /**
     * Checks a single YouTube channel's status by calling our backend proxy.
     * @param {string} channelIdentifier - The cleaned channel identifier.
     * @returns {Promise<{identifier: string, status: 'active' | 'banned'}>}
     */
    const checkChannelStatus = async (channelIdentifier) => {
        try {
            // The backend can handle various formats, so we don't need complex cleaning
            const response = await fetch(`/api/check-youtube?channel=${encodeURIComponent(channelIdentifier)}`);
            if (!response.ok) {
                // If response is not OK (e.g., 404, 500), treat as banned/not found
                return { identifier: channelIdentifier, status: 'banned' };
            }
            const data = await response.json();
            // Assuming the API returns { status: 'active' } or { status: 'terminated' }
            if (data.status === 'active') {
                return { identifier: channelIdentifier, status: 'active' };
            }
            return { identifier: channelIdentifier, status: 'banned' };
        } catch (error) {
            console.error(`Error checking channel ${channelIdentifier}:`, error);
            return { identifier: channelIdentifier, status: 'banned' };
        }
    };

    /**
     * Main function to process all usernames.
     */
    const handleCheck = async () => {
        const channels = usernameInput.value.split('\\n').map(u => u.trim()).filter(Boolean);
        if (channels.length === 0) {
            return;
        }

        toggleLoading(true);
        resultsContainer.classList.add('hidden');
        activeList.value = '';
        bannedList.value = '';

        const promises = channels.map(checkChannelStatus);
        const results = await Promise.all(promises);

        const activeChannels = [];
        const bannedChannels = [];

        results.forEach(result => {
            if (result.status === 'active') {
                activeChannels.push(result.identifier);
            } else {
                bannedChannels.push(result.identifier);
            }
        });
        
        activeList.value = activeChannels.join('\\n');
        bannedList.value = bannedChannels.join('\\n');
        activeCount.textContent = activeChannels.length;
        bannedCount.textContent = bannedChannels.length;

        resultsContainer.classList.remove('hidden');
        toggleLoading(false);
    };

    // --- Event Listeners ---
    checkButton.addEventListener('click', handleCheck);
    copyActiveButton.addEventListener('click', () => copyToClipboard(activeList, copyActiveButton));
    copyBannedButton.addEventListener('click', () => copyToClipboard(bannedList, copyBannedButton));
}); 