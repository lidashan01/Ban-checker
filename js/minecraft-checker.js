document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const usernamesInput = document.getElementById('usernames-input');
    const checkButton = document.getElementById('check-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsArea = document.getElementById('results-area');
    const shareText = document.getElementById('share-text');

    // --- Helper Functions ---

    /**
     * Creates an HTML element for a player's profile.
     * @param {object} data - The player data from the API.
     * @returns {string} - HTML string for the profile card.
     */
    const createProfileCard = (data) => {
        const uuid = data.uuid; // Use data.uuid instead of data.id
        const currentName = data.username; // Use data.username instead of data.name
        const nameHistory = data.name_history.map(item => `<li>${item.name}</li>`).join('');

        return `
            <div class="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md border border-transparent dark:border-gray-700 minecraft-card">
                <div class="flex-shrink-0">
                    <img src="https://visage.surgeplay.com/bust/128/${uuid}" alt="${currentName}'s skin" class="w-20 h-20 rounded-md">
                </div>
                <div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white">${currentName}</h3>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500 dark:text-gray-400">UUID:</p>
                        <div class="flex items-center gap-2">
                            <input type="text" value="${uuid}" readonly class="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-md p-1 text-xs text-gray-600 dark:text-gray-300">
                            <button class="copy-uuid-btn p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600" data-uuid="${uuid}">Copy</button>
                        </div>
                    </div>
                </div>
                <div class="col-span-full mt-4">
                     <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Name History:</h4>
                     <ul class="list-disc list-inside text-gray-600 dark:text-gray-300 mt-2">${nameHistory}</ul>
                </div>
            </div>
        `;
    };

    /**
     * Creates an HTML element for an available username.
      * @param {string} username - The username that is available.
     * @returns {string} - HTML string for the available card.
     */
    const createAvailableCard = (username) => {
        return `
            <div class="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md border border-transparent dark:border-gray-700">
                <p class="text-center text-lg font-semibold text-green-600 dark:text-green-400">Username "${username}" is available!</p>
            </div>
        `;
    };

    /**
     * Creates an HTML element for an error message.
      * @param {string} username - The username that caused an error.
     * @returns {string} - HTML string for the error card.
     */
    const createErrorCard = (username) => {
        return `
            <div class="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md border border-transparent dark:border-gray-700">
                <p class="text-center text-lg font-semibold text-red-600 dark:text-red-400">Could not check username "${username}". Please try again later.</p>
            </div>
        `;
    };


    /**
     * Fetches player data from the serverless function.
     * @param {string} username - The Minecraft username.
     * @returns {Promise<string>} - A promise that resolves to the HTML card for the result.
     */
    const checkUser = async (username) => {
        try {
            const response = await fetch(`/api/check-minecraft?username=${encodeURIComponent(username)}`);
            if (response.status === 200) {
                const data = await response.json();
                return createProfileCard(data);
            } else if (response.status === 404) {
                // The API now returns an object for 404, so we adapt.
                return createAvailableCard(username);
            } else {
                return createErrorCard(username);
            }
        } catch (error) {
            console.error(`Error checking ${username}:`, error);
            return createErrorCard(username);
        }
    };

    /**
     * Main function to handle the check button click.
     */
    const handleCheck = async () => {
        const usernames = usernamesInput.value
            .split('\n')
            .map(u => u.trim())
            .filter(u => u.length > 0 && u.length <= 16);

        if (usernames.length === 0) {
            return;
        }

        loadingSpinner.classList.remove('hidden');
        resultsArea.classList.add('hidden');
        resultsArea.innerHTML = '';
        shareText.classList.add('hidden');

        const checkPromises = usernames.map(checkUser);
        const results = await Promise.allSettled(checkPromises);

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                resultsArea.insertAdjacentHTML('beforeend', result.value);
            }
        });
        
        loadingSpinner.classList.add('hidden');
        resultsArea.classList.remove('hidden');
        shareText.classList.remove('hidden');
    };

    // --- Event Listeners ---
    if (checkButton) {
        checkButton.addEventListener('click', handleCheck);
    }

    if (resultsArea) {
        resultsArea.addEventListener('click', (event) => {
            if (event.target.classList.contains('copy-uuid-btn')) {
                const uuid = event.target.dataset.uuid;
                navigator.clipboard.writeText(uuid).then(() => {
                    const originalText = event.target.textContent;
                    event.target.textContent = 'Copied!';
                    setTimeout(() => {
                        event.target.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy UUID: ', err);
                });
            }
        });
    }
}); 