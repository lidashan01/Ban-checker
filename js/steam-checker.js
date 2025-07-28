document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const userInputArea = document.getElementById('steam-input');
    const checkButton = document.getElementById('check-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsArea = document.getElementById('results-area');
    const resultsContainer = document.getElementById('results-container'); // Container for detailed result cards

    /**
     * Cleans the user input to extract a Steam ID or vanity name.
     * @param {string} userInput - The raw text from the input field.
     * @returns {string} The cleaned-up ID or name.
     */
    const cleanUserInput = (userInput) => {
        try {
            if (userInput.includes('steamcommunity.com/id/')) {
                return userInput.split('steamcommunity.com/id/')[1].split('/')[0];
            } else if (userInput.includes('steamcommunity.com/profiles/')) {
                return userInput.split('steamcommunity.com/profiles/')[1].split('/')[0];
            }
        } catch (e) {
            // Ignore errors if splitting fails, proceed with the raw input
        }
        return userInput;
    };

    /**
     * Checks the status of a single Steam user input by calling our backend API.
     * @param {string} userInput - The raw user input.
     * @param {string} cleanedInput - The cleaned user input for the API call.
     * @returns {Promise<{userInput: string, status: 'good' | 'bad' | 'error', details: object}>}
     */
    const checkUserStatus = async (userInput, cleanedInput) => {
        try {
            const response = await fetch(`/api/check-steam?user_input=${cleanedInput}`);
            const data = await response.json();
            
            if (response.ok) {
                return { userInput, status: data.status, details: data };
            } else {
                return { userInput, status: 'error', details: data };
            }
        } catch (error) {
            console.error(`Error checking ${userInput}:`, error);
            return { userInput, status: 'error', details: { reason: 'Network error or invalid response from server' } };
        }
    };

    /**
     * Creates an HTML card to display the detailed results for a user.
     * @param {string} originalInput - The user's original, unmodified input.
     * @param {object} result - The result object from checkUserStatus.
     */
    const createResultCard = (originalInput, result) => {
        const { status, details } = result;
        const isBad = status === 'bad';
        const isError = status === 'error';
        
        let cardClass = 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700';
        if (isBad) cardClass = 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700';
        if (isError) cardClass = 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-400 dark:border-yellow-700';

        let statusText = 'Clean';
        if (isBad) statusText = 'Banned';
        if (isError) statusText = 'Error';

        let statusClass = 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100';
        if (isBad) statusClass = 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100';
        if (isError) statusClass = 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';

        let bansInfo = '';
        if (isBad) {
            bansInfo = `
                <ul class="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-300">
                    ${details.vacBanned ? `<li><b>${details.numberOfVACBans}</b> VAC Ban(s)</li>` : ''}
                    ${details.communityBanned ? `<li>Community Banned</li>` : ''}
                    ${details.numberOfGameBans > 0 ? `<li><b>${details.numberOfGameBans}</b> Game Ban(s)</li>` : ''}
                    ${details.economyBan !== 'none' ? `<li>Trade Ban: ${details.economyBan}</li>` : ''}
                </ul>`;
        } else if (isError) {
            bansInfo = `<p class="text-sm text-gray-700 dark:text-gray-300 mt-2">${details.reason || details.error}</p>`;
        }

        const card = document.createElement('div');
        card.className = `p-4 rounded-lg border ${cardClass}`;
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <p class="font-bold text-gray-800 dark:text-gray-100 break-all">${originalInput}</p>
                <span class="px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusClass}">
                    ${statusText}
                </span>
            </div>
            ${bansInfo}
            ${details.steamId ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">SteamID64: ${details.steamId}</p>` : ''}
        `;
        return card;
    };

    /**
     * Main function to handle the entire check process.
     */
    const handleAccountCheck = async () => {
        const userInputs = userInputArea.value
            .split('\n')
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (userInputs.length === 0) return;

        loadingSpinner.classList.remove('hidden');
        resultsArea.classList.add('hidden');
        resultsContainer.innerHTML = '';

        const checkPromises = userInputs.map(input => {
            const cleaned = cleanUserInput(input);
            return checkUserStatus(input, cleaned);
        });

        const results = await Promise.all(checkPromises);

        results.forEach(result => {
            const card = createResultCard(result.userInput, result);
            resultsContainer.appendChild(card);
        });

        loadingSpinner.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    };

    // --- Event Listeners ---
    checkButton.addEventListener('click', handleAccountCheck);
    userInputArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAccountCheck();
        }
    });
}); 