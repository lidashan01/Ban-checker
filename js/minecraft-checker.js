document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('minecraft-input');
    const checkButton = document.getElementById('check-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsArea = document.getElementById('results-area');
    const resultsContainer = document.getElementById('results-container');

    /**
     * Creates an HTML card for a user that was not found.
     * @param {string} username - The username that was searched for.
     */
    const createNotFoundCard = (username) => {
        const card = document.createElement('div');
        card.className = 'bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-700 p-6 rounded-lg text-center';
        card.innerHTML = `
            <h3 class="text-xl font-bold text-yellow-800 dark:text-yellow-200">User Not Found</h3>
            <p class="text-gray-600 dark:text-gray-300 mt-2">The username <strong class="font-semibold">${username}</strong> could not be found. Please check the spelling and try again.</p>
        `;
        return card;
    };

    /**
     * Creates a detailed HTML profile card for a found user.
     * @param {object} data - The profile data from the API.
     */
    const createProfileCard = (data) => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800/50 border border-transparent dark:border-gray-700 p-6 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-3 gap-6 items-center';

        // 1. Skin Renderer
        const skinViewer = `
            <div class="md:col-span-1 flex justify-center items-center">
                <img src="https://crafatar.com/renders/body/${data.uuid}?overlay" alt="${data.username}'s skin" class="h-48" loading="lazy">
            </div>
        `;

        // 2. Name History
        const nameHistory = data.name_history.map(item => {
            const date = (item.changedToAt === 'Original Name')
                ? 'Original Name'
                : new Date(item.changedToAt).toLocaleDateString();
            return `<li class="flex justify-between items-center py-1"><span class="font-semibold">${item.name}</span><span class="text-xs text-gray-500 dark:text-gray-400">${date}</span></li>`;
        }).join('');

        // 3. Main Info Section
        const mainInfo = `
            <div class="md:col-span-2">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">${data.username}</h2>
                    <span class="mt-2 md:mt-0 px-3 py-1 text-sm font-semibold rounded-full bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100">Valid</span>
                </div>
                <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">UUID</label>
                    <div class="flex items-center gap-2 mt-1">
                        <input type="text" value="${data.uuid}" class="w-full px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm" readonly>
                        <button class="copy-uuid-button bg-blue-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap">Copy</button>
                    </div>
                </div>
                <div class="mt-4">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">Name History</h3>
                    <ul class="mt-2 divide-y divide-gray-200 dark:divide-gray-700">${nameHistory}</ul>
                </div>
            </div>
        `;
        
        card.innerHTML = `${skinViewer}${mainInfo}`;
        return card;
    };

    /**
     * Main function to handle the check process.
     */
    const handleCheck = async () => {
        const username = userInput.value.trim();
        if (!username) return;

        loadingSpinner.classList.remove('hidden');
        resultsArea.classList.add('hidden');
        resultsContainer.innerHTML = '';

        try {
            const response = await fetch(`/api/check-minecraft?username=${username}`);
            const data = await response.json();

            if (response.ok) {
                resultsContainer.appendChild(createProfileCard(data));
            } else {
                resultsContainer.appendChild(createNotFoundCard(username));
            }
        } catch (error) {
            console.error('Error:', error);
            resultsContainer.innerHTML = `<p class="text-center text-red-500">An unexpected error occurred. Please try again later.</p>`;
        }

        loadingSpinner.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    };

    // --- Event Listeners ---
    checkButton.addEventListener('click', handleCheck);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCheck();
        }
    });

    resultsArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-uuid-button')) {
            const button = e.target;
            const input = button.previousElementSibling;
            
            navigator.clipboard.writeText(input.value).then(() => {
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy UUID: ', err);
            });
        }
    });
}); 