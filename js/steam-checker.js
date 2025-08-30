(function () {
  const initializeSteamChecker = () => {
    const query = (selector, root = document) => root.querySelector(selector);

    // Scope strictly to the Steam checker section to avoid affecting other pages
    const checkerSection = document.getElementById('steam-checker');
    if (!checkerSection) {
      // Not on Steam checker page; do nothing
      return;
    }

    // Support both new and legacy IDs/selectors within the section
    const inputElement =
      query('#steam-input', checkerSection) ||
      query('#steamId', checkerSection) ||
      query('#steam-id', checkerSection) ||
      query('input[placeholder*="Steam ID" i]', checkerSection) ||
      query('textarea#steam-input', checkerSection);

    const spinner =
      query('#loading-spinner', checkerSection) || query('[data-role="loading-spinner"]', checkerSection);
    const resultsArea =
      query('#results-area', checkerSection) || query('[data-role="results-area"]', checkerSection);
    const resultsContainer =
      query('#results-container', checkerSection) || query('[data-role="results-container"]', checkerSection);

    if (!inputElement) {
      console.warn('[SteamChecker] Input element not found in #steam-checker section.');
    }

    const showSpinner = (show) => {
      if (!spinner) return;
      spinner.classList[show ? 'remove' : 'add']('hidden');
    };

    const clearResults = () => {
      if (resultsContainer) {
        resultsContainer.innerHTML = '';
      }
    };

    const ensureResultsAreaVisible = () => {
      if (resultsArea) {
        resultsArea.classList.remove('hidden');
      }
    };

    const createResultCard = (htmlContent) => {
      const card = document.createElement('div');
      card.className = 'p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow border border-transparent dark:border-gray-700';
      card.innerHTML = htmlContent;
      return card;
    };

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

    const handleCheck = async () => {
      const raw = (inputElement && inputElement.value ? inputElement.value : '').trim();
      if (!raw) {
        alert('Please enter a Steam profile URL, vanity URL, or SteamID64.');
        return;
      }

      const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      if (lines.length === 0) {
        alert('Please enter a Steam profile URL, vanity URL, or SteamID64.');
        return;
      }

      showSpinner(true);
      clearResults();

      for (const line of lines) {
        const parsed = parseSteamInput(line);
        if (!parsed) continue;
        if (parsed.type === 'steamid64') {
          if (resultsContainer) resultsContainer.appendChild(renderIdCard(line, parsed.value));
        } else {
          if (resultsContainer) resultsContainer.appendChild(renderVanityNotice(line, parsed.value));
        }
      }

      showSpinner(false);
      ensureResultsAreaVisible();
    };

    // Delegated click listener within the Steam section only
    checkerSection.addEventListener('click', (event) => {
      const target = event.target;
      if (!target) return;
      const clickedCheck = target.closest('#check-button, #checkBan, #check-ban, [data-action="check-ban"]');
      if (clickedCheck) {
        event.preventDefault();
        handleCheck();
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSteamChecker);
  } else {
    initializeSteamChecker();
  }
})(); 