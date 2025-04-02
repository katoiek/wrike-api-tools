
// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  console.log('Wrike API Tools loaded');

  // Language switcher functionality
  const languageLinks = document.querySelectorAll('[data-lang]');

  languageLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Get the language from data attribute
      const lang = this.getAttribute('data-lang');

      // Set cookie directly from JavaScript as a backup
      document.cookie = `lang=${lang};path=/;max-age=${365 * 24 * 60 * 60}`;

      // Log for debugging
      console.log(`Language set to: ${lang}`);

      // Continue with the normal link behavior
      // The server-side handler will also set the cookie
    });
  });
});
