import express from 'express';

const router = express.Router();

/**
 * Route to change the language and redirect back to the previous page
 * 言語を変更して前のページにリダイレクトするルート
 */
// Handle both route parameter and query parameter
router.get('/change/:lang', setLanguage);
router.get('/change', setLanguage);

// Function to set language
function setLanguage(req: express.Request, res: express.Response) {
  // Get language from route param or query param
  const lang = req.params.lang || req.query.lang as string;
  const referer = req.headers.referer || '/';

  // Only set language if it's one of our supported languages
  // サポートされている言語の場合のみ設定
  if (lang && ['en', 'ja'].includes(lang)) {
    // Set the language in cookie directly with long expiration
    res.cookie('lang', lang, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: false,
      path: '/'
    });

    // Also try to set using i18n method if available
    if (typeof req.setLocale === 'function') {
      req.setLocale(lang);
    }

    // Log for debugging
    console.log(`Language changed to: ${lang} (Cookie set)`);

    // Create URL object from referer to manipulate
    const url = new URL(referer);

    // Remove any existing lang parameter
    url.searchParams.delete('lang');

    // Redirect back to the referring page without the lang parameter
    res.redirect(url.toString());
  } else {
    // If language is not supported, just redirect back
    console.log('Invalid language specified:', lang);
    res.redirect(referer);
  }
}

export default router;
