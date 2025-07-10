/*
  This file is reserved for global JavaScript functionalities for banchecker.org.
  Each checker tool (Reddit, Roblox, etc.) should have its own specific script.
*/

document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}); 