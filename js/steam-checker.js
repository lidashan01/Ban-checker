document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const usernamesInput = document.getElementById('usernames-input');
    const checkButton = document.getElementById('check-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsArea = document.getElementById('results-area');
    const resultsContainer = document.getElementById('results-container');

    // Only initialize if we're on the Steam checker page
    if (!usernamesInput || !checkButton) {
        return;
    }

    // --- Helper Functions ---

    const isSteamId64 = (value) => /^\d{17}$/.test(value);

    const parseSteamInput = (raw) => {
        const value = raw.trim();
        if (!value) return null;

        // Direct 64-bit ID
        if (isSteamId64(value)) {
            return { type: 'steamid64', value };
        }

        try {
            const url = new URL(value.startsWith('http') ? value : `https://${value}`);
            const host = url.hostname.replace(/^www\./, '');
            if (host === 'steamcommunity.com') {
                const parts = url.pathname.split('/').filter(Boolean);
                // /profiles/7656119... or /id/vanity
                if (parts[0] === 'profiles' && parts[1] && isSteamId64(parts[1])) {
                    return { type: 'steamid64', value: parts[1] };
                }
                if (parts[0] === 'id' && parts[1]) {
                    return { type: 'vanity', value: parts[1] };
                }
            }
        } catch (_) {
            // Not a URL; fall through
        }

        // Plain vanity string fallback
        return { type: 'vanity', value };
    };

    const createResultCard = (htmlContent) => {
        const card = document.createElement('div');
        card.className = 'p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow border border-transparent dark:border-gray-700 mb-4';
        card.innerHTML = htmlContent;
        return card;
    };

    const renderVanityNotice = (original, vanity) => {
        const content = `
            <div class="flex items-start gap-3">
                <div class="shrink-0 mt-1 w-2 h-2 rounded-full bg-amber-500"></div>
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">${original}</h4>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Detected a Steam vanity URL or name: <span class="font-mono">${vanity}</span>.
                        Vanity resolution to SteamID64 is not available in this local environment. Please enter a full profile URL under <span class="font-mono">/profiles/</span> or a 17-digit SteamID64.
                    </p>
                </div>
            </div>
        `;
        return createResultCard(content);
    };

    const renderIdCard = (original, steamId64) => {
        const content = `
            <div class="space-y-2">
                <div class="flex items-start gap-3">
                    <div class="shrink-0 mt-1 w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">${original}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-300">Parsed SteamID64: <span class="font-mono">${steamId64}</span></p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Live ban lookup requires server/API credentials and is disabled here. Parsing works and the page is now error-free.</p>
                    </div>
                </div>
            </div>
        `;
        return createResultCard(content);
    };

    // --- Main Check Function ---
    const handleCheck = async () => {
        const raw = usernamesInput.value.trim();
        if (!raw) {
            alert('Please enter a Steam profile URL, vanity URL, or SteamID64.');
            return;
        }

        const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        if (lines.length === 0) {
            alert('Please enter a Steam profile URL, vanity URL, or SteamID64.');
            return;
        }

        // Show loading state
        if (loadingSpinner) {
            loadingSpinner.classList.remove('hidden');
        }
        
        // Clear results container
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }

        // Process each line
        for (const line of lines) {
            const parsed = parseSteamInput(line);
            if (!parsed) continue;
            
            if (parsed.type === 'steamid64') {
                if (resultsContainer) {
                    resultsContainer.appendChild(renderIdCard(line, parsed.value));
                }
            } else {
                if (resultsContainer) {
                    resultsContainer.appendChild(renderVanityNotice(line, parsed.value));
                }
            }
        }

        // Hide loading and show results
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
        if (resultsArea) {
            resultsArea.classList.remove('hidden');
        }
    };

    // --- Event Listeners ---
    checkButton.addEventListener('click', handleCheck);
}); 