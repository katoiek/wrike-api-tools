import express from 'express';
import { wrikeApi } from '../services/wrike-api';

const router = express.Router();

/**
 * Start OAuth flow
 */
router.get('/login', async (req, res) => {
  try {
    const authUrl = await wrikeApi.getAuthorizationUrl();
    res.redirect(authUrl);
  } catch (error: any) {
    res.render('error', {
      title: 'Authentication Error',
      message: `Failed to get authorization URL: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * OAuth callback
 */
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.render('error', {
      title: 'Authentication Error',
      message: `Authentication failed: ${error}`
    });
  }

  if (!code) {
    return res.render('error', {
      title: 'Authentication Error',
      message: 'No authorization code received'
    });
  }

  try {
    const success = await wrikeApi.exchangeCodeForToken(code as string);

    if (success) {
      // Get user info to confirm authentication
      const userInfo = await wrikeApi.getCurrentUser();

      if (userInfo && userInfo.data && userInfo.data.length > 0) {
        req.session.authenticated = true;
        req.session.userInfo = userInfo.data[0];

        res.redirect('/');
      } else {
        res.render('error', {
          title: 'Authentication Error',
          message: 'Failed to get user information'
        });
      }
    } else {
      res.render('error', {
        title: 'Authentication Error',
        message: 'Failed to exchange authorization code for token'
      });
    }
  } catch (error: any) {
    console.error('Error in auth callback:', error);
    res.render('error', {
      title: 'Authentication Error',
      message: `An error occurred during authentication: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * Logout
 */
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

/**
 * Check authentication status
 */
router.get('/status', (req, res) => {
  res.json({
    authenticated: !!req.session.authenticated,
    user: req.session.userInfo || null
  });
});

export default router;
