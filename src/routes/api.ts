import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { wrikeApi } from '../services/wrike-api';
import { getSetting, getAllSettings, getAllSettingsWithMetadata } from '../services/settings';

const router = express.Router();

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Authentication middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * Get current user
 */
router.get('/me', async (req, res) => {
  try {
    const result = await wrikeApi.getCurrentUser();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get contacts (users)
 */
router.get('/contacts', async (req, res) => {
  try {
    const result = await wrikeApi.getContacts(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get spaces
 */
router.get('/spaces', async (req, res) => {
  try {
    const result = await wrikeApi.getSpaces(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get folders
 */
router.get('/folders', async (req, res) => {
  try {
    const result = await wrikeApi.getFolders(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get folders in a space
 */
router.get('/spaces/:spaceId/folders', async (req, res) => {
  try {
    const { spaceId } = req.params;
    const result = await wrikeApi.getFoldersInSpace(spaceId, req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get tasks
 */
router.get('/tasks', async (req, res) => {
  try {
    const result = await wrikeApi.getTasks(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get tasks in a folder
 */
router.get('/folders/:folderId/tasks', async (req, res) => {
  try {
    const { folderId } = req.params;
    const result = await wrikeApi.getTasksInFolder(folderId, req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create a task in a folder
 */
router.post('/folders/:folderId/tasks', async (req, res) => {
  try {
    const { folderId } = req.params;
    const result = await wrikeApi.createTask(folderId, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create a user invitation
 */
router.post('/invitations', async (req, res) => {
  try {
    const result = await wrikeApi.createInvitation(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload CSV file for bulk user invitations
 */
router.post('/invitations/bulk', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const invitations: any[] = [];

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Validate required fields
        if (!data.email) {
          return;
        }

        // Create invitation object
        const invitation = {
          email: data.email,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          role: data.role || 'User'
        };

        invitations.push(invitation);
      })
      .on('end', async () => {
        // Clean up uploaded file
        fs.unlinkSync(req.file!.path);

        if (invitations.length === 0) {
          return res.status(400).json({ error: 'No valid invitations found in CSV' });
        }

        // Process invitations
        const results = await wrikeApi.createBulkInvitations(invitations);
        res.json(results);
      });
  } catch (error: any) {
    // Clean up uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all settings
 */
router.get('/settings', async (req, res) => {
  try {
    const includeEncrypted = req.query.includeEncrypted === 'true';
    const settings = await getAllSettings(includeEncrypted);
    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all settings with metadata
 */
router.get('/settings/metadata', async (req, res) => {
  try {
    const settings = await getAllSettingsWithMetadata();
    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific setting
 */
router.get('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const decrypt = req.query.decrypt === 'true';

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const value = await getSetting(key);

    if (value === null) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ key, value });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
