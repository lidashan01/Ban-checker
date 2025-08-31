document.addEventListener('DOMContentLoaded', () => {
    console.log('[Steam Checker] Script loaded');
    
    // --- DOM Elements ---
    // Try multiple selectors to find elements in different page versions
    const inputElement = document.getElementById('steam-input') || 
                        document.querySelector('input[placeholder*="Steam ID" i]') ||
                        document.querySelector('input[placeholder*="7656" i]');
    
    const checkButton = document.getElementById('check-button') || 
                       document.querySelector('button[value="Check Ban"]') ||
                       document.querySelector('input[value="Check Ban"]');
    
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsArea = document.getElementById('results-area');
    const resultsContainer = document.getElementById('results-container');

    console.log('[Steam Checker] Elements found:', {
        inputElement: !!inputElement,
        checkButton: !!checkButton,
        loadingSpinner: !!loadingSpinner,
        resultsArea: !!resultsArea,
        resultsContainer: !!resultsContainer
    });

    // Only initialize if we can find at least an input element
    if (!inputElement) {
        console.log('[Steam Checker] No input element found, skipping initialization');
        return;
    }

    // If no check button found, try to find one by text content
    let actualCheckButton = checkButton;
    if (!checkButton) {
        // Try to find button by text content
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        for (const btn of buttons) {
            const text = (btn.textContent || btn.value || '').toLowerCase();
            if (text.includes('check') || text.includes('ban')) {
                actualCheckButton = btn;
                console.log('[Steam Checker] Found button by text:', text, btn);
                break;
            }
        }
        
        // If still no button found, use the first available button
        if (!actualCheckButton && buttons.length > 0) {
            actualCheckButton = buttons[0];
            console.log('[Steam Checker] Using first available button:', actualCheckButton);
        }
    }

    console.log('[Steam Checker] Initializing...');

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
        card.className = 'p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow border border-transparent dark:border-gray-700';
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
        const raw = inputElement.value.trim();
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
        
        // Create results container if it doesn't exist
        let actualResultsContainer = resultsContainer;
        if (!resultsContainer) {
            actualResultsContainer = document.createElement('div');
            actualResultsContainer.id = 'results-container-fallback';
            actualResultsContainer.style.marginTop = '20px';
            inputElement.parentNode.appendChild(actualResultsContainer);
            console.log('[Steam Checker] Created fallback results container');
        }
        
        actualResultsContainer.innerHTML = '';

        // Process each line
        for (const line of lines) {
            const parsed = parseSteamInput(line);
            if (!parsed) continue;
            
            if (parsed.type === 'steamid64') {
                actualResultsContainer.appendChild(renderIdCard(line, parsed.value));
            } else {
                actualResultsContainer.appendChild(renderVanityNotice(line, parsed.value));
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
    if (actualCheckButton) {
        actualCheckButton.addEventListener('click', handleCheck);
        console.log('[Steam Checker] Event listener attached to button');
    } else {
        console.log('[Steam Checker] No button found for event listener');
    }
}); 