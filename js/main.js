/*
  This file is reserved for global JavaScript functionalities for banchecker.org.
  The Reddit Checker tool has its own specific script at js/reddit-checker.js.
*/

document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username-input');
    const checkButton = document.getElementById('check-button');
    const resultContainer = document.getElementById('result-container');

    const checkStatus = async () => {
        const username = usernameInput.value.trim();
        if (!username) {
            resultContainer.innerHTML = `<p class="text-yellow-600">Please enter a username.</p>`;
            return;
        }

        resultContainer.innerHTML = `<p class="text-gray-500">Checking...</p>`;

        try {
            // Fetch user profile data from Reddit's JSON API
            const response = await fetch(`https://www.reddit.com/user/${username}/about.json`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                 // Check if the response is a redirect to the search page (which happens for suspended accounts)
                if (response.redirected && response.url.includes('/search?q=')) {
                     resultContainer.innerHTML = `
                        <div class="p-4 rounded-lg bg-red-100 border border-red-200">
                            <p class="font-bold text-red-800">Account Suspended</p>
                            <p class="text-sm text-red-700 mt-1">The account <span class="font-semibold">${username}</span> is suspended by Reddit.</p>
                        </div>`;
                    return;
                }

                const data = await response.json();
                if (data && data.kind === 't2') {
                    resultContainer.innerHTML = `
                        <div class="p-4 rounded-lg bg-green-100 border border-green-200">
                            <p class="font-bold text-green-800">Not Shadowbanned</p>
                            <p class="text-sm text-green-700 mt-1">The account <span class="font-semibold">${username}</span> is active and visible.</p>
                        </div>`;
                } else {
                    // This case is unlikely if response.ok is true, but good to have a fallback.
                    throw new Error('User not found or unexpected data format');
                }
            } else if (response.status === 404) {
                 // 404 can mean shadowbanned OR user does not exist.
                 resultContainer.innerHTML = `
                    <div class="p-4 rounded-lg bg-yellow-100 border border-yellow-200">
                        <p class="font-bold text-yellow-800">Shadowbanned / Not Found</p>
                        <p class="text-sm text-yellow-700 mt-1">The account <span class="font-semibold">${username}</span> is either shadowbanned or does not exist.</p>
                    </div>`;
            } else {
                // Handle other HTTP errors
                throw new Error(`Reddit API returned an error: ${response.status}`);
            }
        } catch (error) {
            console.error("Error checking status:", error);
            resultContainer.innerHTML = `
                <div class="p-4 rounded-lg bg-red-100 border border-red-200">
                    <p class="font-bold text-red-800">Error</p>
                    <p class="text-sm text-red-700 mt-1">Could not check the status. Please check the username or try again later.</p>
                </div>`;
        }
    };

    checkButton.addEventListener('click', checkStatus);
    usernameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkStatus();
        }
    });
}); 