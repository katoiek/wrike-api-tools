import express from 'express';
import { getSetting, setSetting, deleteSetting, getAllSettings, getAllSettingsWithMetadata, initializeDefaultSettings } from '../services/settings';

const router = express.Router();

// Authentication middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.authenticated) {
    return res.redirect('/auth/login');
  }
  next();
}

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * Settings page
 */
router.get('/', async (req, res) => {
  try {
    // Initialize default settings
    await initializeDefaultSettings();

    // Get all settings with metadata
    const settingsWithMetadata = await getAllSettingsWithMetadata();

    // Get settings for display (without decrypting sensitive values)
    const settings = await getAllSettings(false);

    // Get Wrike API settings for pre-filling the form
    const clientId = await getSetting('WRIKE_CLIENT_ID') || '';
    const clientSecret = await getSetting('WRIKE_CLIENT_SECRET') || '';
    const redirectUri = await getSetting('WRIKE_REDIRECT_URI') || 'http://localhost:3000/auth/callback';

    res.render('settings', {
      title: '設定管理',
      settings,
      settingsWithMetadata,
      wrikeSettings: {
        clientId,
        clientSecret,
        redirectUri
      },
      user: req.session.userInfo
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.render('error', {
      title: 'エラー',
      message: '設定の読み込みに失敗しました'
    });
  }
});

/**
 * Update settings
 */
router.post('/', async (req, res) => {
  try {
    const { key, value, encrypted } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'キーと値は必須です' });
    }

    const success = await setSetting(key, value, encrypted === 'true');

    if (success) {
      res.redirect('/settings');
    } else {
      res.render('error', {
        title: 'エラー',
        message: '設定の更新に失敗しました'
      });
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    res.render('error', {
      title: 'エラー',
      message: '設定の更新に失敗しました'
    });
  }
});

/**
 * Delete setting
 */
router.post('/delete', async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'キーは必須です' });
    }

    const success = await deleteSetting(key);

    if (success) {
      res.redirect('/settings');
    } else {
      res.render('error', {
        title: 'エラー',
        message: '設定の削除に失敗しました'
      });
    }
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.render('error', {
      title: 'エラー',
      message: '設定の削除に失敗しました'
    });
  }
});

/**
 * API settings update
 */
router.post('/api', async (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body;

    // Update settings
    if (clientId) {
      await setSetting('WRIKE_CLIENT_ID', clientId, true);
    }

    if (clientSecret) {
      await setSetting('WRIKE_CLIENT_SECRET', clientSecret, true);
    }

    if (redirectUri) {
      await setSetting('WRIKE_REDIRECT_URI', redirectUri, false);
    }

    res.redirect('/settings');
  } catch (error) {
    console.error('Error updating API settings:', error);
    res.render('error', {
      title: 'エラー',
      message: 'API設定の更新に失敗しました'
    });
  }
});

export default router;
