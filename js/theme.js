// Theme toggle functionality
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleCircle = document.getElementById('theme-toggle-circle');

// Function to set the theme based on stored preference or system setting
function applyTheme() {
    // Check if a theme is saved in localStorage
    const savedTheme = localStorage.getItem('color-theme');
    // Check the user's OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Event listener for the toggle button
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        // Toggle the 'dark' class on the root <html> element
        document.documentElement.classList.toggle('dark');

        // Save the user's preference to localStorage
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
    });
} else {
    // Avoid errors on pages without the toggle button
    console.warn('[Theme] #theme-toggle not found; theme toggle disabled on this page.');
}

// Apply the theme when the script is loaded
applyTheme(); 