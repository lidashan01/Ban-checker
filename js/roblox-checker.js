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
     * Convert a Roblox username to a user ID
     * @param {string} username - The Roblox username to convert
     * @returns {Promise<number|null>} - The user ID or null if not found
     */
    const getUserId = async (username) => {
        try {
            console.log(`Looking up user ID for: ${username}`);
            
            const response = await fetch('https://users.roblox.com/v1/usernames/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usernames: [username],
                    excludeBannedUsers: false
                })
            });
            
            if (!response.ok) {
                console.warn(`API returned error ${response.status} for username: ${username}`);
                return null;
            }
            
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                const userId = data.data[0].id;
                console.log(`Found user ID ${userId} for username: ${username}`);
                return userId;
            }
            
            console.warn(`No user found with username: ${username}`);
            return null; // User not found
        } catch (error) {
            console.error(`Error getting user ID for ${username}:`, error);
            return null;
        }
    };

    /**
     * Check if a Roblox account is banned or deleted
     * @param {number} userId - The Roblox user ID to check
     * @returns {Promise<{isActive: boolean, reason: string}>} - Status info
     */
    const checkAccountStatus = async (userId) => {
        try {
            console.log(`Checking status for user ID: ${userId}`);
            
            // First check: Basic profile data
            const profileResponse = await fetch(`https://users.roblox.com/v1/users/${userId}`);
            
            if (!profileResponse.ok) {
                const errorMessage = `API returned error ${profileResponse.status} for profile`;
                console.warn(errorMessage);
                return { isActive: false, reason: errorMessage };
            }
            
            const profileData = await profileResponse.json();
            console.log(`User profile data for ${userId}:`, profileData);
            
            // If explicitly banned, no need to check further
            if (profileData.isBanned === true) {
                return { isActive: false, reason: "Account is banned" };
            }
            
            // Second check: Try to access friends list (banned accounts will fail here)
            try {
                const friendsResponse = await fetch(`https://friends.roblox.com/v1/users/${userId}/friends`);
                
                // If we can access the friends list, the account is definitely active
                if (friendsResponse.ok) {
                    return { isActive: true, reason: "Account is active (verified)" };
                }
                
                // If we get a 403 Forbidden specifically, this often means the account is banned
                if (friendsResponse.status === 403) {
                    console.warn(`Friends API returned 403 for user ${userId} - likely banned`);
                    return { isActive: false, reason: "Account appears to be restricted" };
                }
                
                // Other errors from friends API are not conclusive
                console.warn(`Friends API returned ${friendsResponse.status} for user ${userId}`);
            } catch (friendsError) {
                console.warn(`Error checking friends for ${userId}:`, friendsError);
                // Continue with our decision based on profile data
            }
            
            // If we got this far and have profile data, the account is probably active
            return { isActive: true, reason: "Account appears to be active" };
            
        } catch (error) {
            console.error(`Error checking account status for user ID ${userId}:`, error);
            return { isActive: false, reason: "Error checking account" };
        }
    };

    /**
     * Main function to check a single username
     * @param {string} username - The username to check
     * @returns {Promise<{username: string, status: 'good'|'bad', reason: string}>}
     */
    const checkUserStatus = async (username) => {
        try {
            // Clean up the username
            const cleanUsername = username.trim();
            
            // Get the user ID
            const userId = await getUserId(cleanUsername);
            
            // If no user ID found, account doesn't exist
            if (!userId) {
                return { username: cleanUsername, status: 'bad', reason: 'Account not found' };
            }
            
            // Check the account status
            const statusInfo = await checkAccountStatus(userId);
            
            if (statusInfo.isActive) {
                return { username: cleanUsername, status: 'good', reason: statusInfo.reason };
            } else {
                return { username: cleanUsername, status: 'bad', reason: statusInfo.reason };
            }
        } catch (error) {
            console.error(`Error checking ${username}:`, error);
            return { username, status: 'bad', reason: 'Error checking account' };
        }
    };

    /**
     * Process all usernames from the input field
     */
    const handleAccountCheck = async () => {
        const usernames = usernamesInput.value
            .split('\n')
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (usernames.length === 0) {
            return;
        }

        // Update UI: Start loading
        loadingSpinner.classList.remove('hidden');
        resultsArea.classList.add('hidden');
        goodAccountsArea.value = '';
        badAccountsArea.value = '';

        // Process each username with a small delay to avoid rate limiting
        const results = [];
        for (const username of usernames) {
            try {
                const result = await checkUserStatus(username);
                results.push(result);
                
                // Add a small delay between requests to be respectful to Roblox's API
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error processing ${username}:`, error);
                results.push({ username, status: 'bad', reason: 'Error processing request' });
            }
        }

        // Format results with reasons
        const goodAccounts = results
            .filter(result => result.status === 'good')
            .map(result => `${result.username} (${result.reason})`);
            
        const badAccounts = results
            .filter(result => result.status === 'bad')
            .map(result => `${result.username} (${result.reason})`);

        // Update UI: Display results
        goodAccountsArea.value = goodAccounts.join('\n');
        badAccountsArea.value = badAccounts.join('\n');
        loadingSpinner.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    };

    // --- Clipboard Logic ---

    /**
     * Copy text from a textarea to clipboard
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