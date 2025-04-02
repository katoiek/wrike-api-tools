import express from 'express';
import { wrikeApi } from '../services/wrike-api';

const router = express.Router();

// Authentication middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.authenticated) {
    return res.redirect('/auth/login');
  }
  next();
}

/**
 * Home page
 */
router.get('/', async (req, res) => {
  if (!req.session.authenticated) {
    return res.render('login', {
      title: 'Login'
    });
  }

  try {
    // Get statistics
    const stats = {
      spaces: 0,
      tasks: 0 as number | string,
      users: 0
    };

    // Get spaces count
    try {
      // スペースAPIではパラメータを使用しない
      const spacesResult = await wrikeApi.getSpaces();
      if (spacesResult && spacesResult.data) {
        stats.spaces = spacesResult.data.length;
      }
    } catch (error) {
      console.error('Error getting spaces count:', error);
    }

    // Get tasks count
    try {
      // タスクAPIではpageSizeパラメータが使用可能（1000件取得）
      const tasksResult = await wrikeApi.getTasks({ pageSize: 1000 });
      if (tasksResult && tasksResult.data) {
        // 実際の総タスク数を表示（nextPageTokenがある場合は「1000+」と表示）
        stats.tasks = tasksResult.nextPageToken ? '1000+' : tasksResult.data.length;
      }
    } catch (error) {
      console.error('Error getting tasks count:', error);
    }

    // Get users count
    try {
      // コンタクトAPIではパラメータを使用しない
      const usersResult = await wrikeApi.getContacts();
      if (usersResult && usersResult.data) {
        stats.users = usersResult.data.length;
      }
    } catch (error) {
      console.error('Error getting users count:', error);
    }

    res.render('index', {
      title: 'Dashboard',
      user: req.session.userInfo,
      stats
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.render('index', {
      title: 'Dashboard',
      user: req.session.userInfo,
      stats: {
        spaces: 0,
        tasks: 0 as number | string,
        users: 0
      },
      error: 'Failed to load dashboard data'
    });
  }
});

/**
 * Spaces page
 */
router.get('/spaces', requireAuth, async (req, res) => {
  try {
    console.log('Spaces route called');
    // ページネーション用のパラメータを取得
    const page = parseInt(req.query.page as string) || 1;
    const pageTokens: { [key: number]: string } = req.session.spacePageTokens || {};

    // APIリクエストのパラメータを設定
    const params: any = {};
    if (page > 1 && pageTokens[page]) {
      params.nextPageToken = pageTokens[page];
    }

    // スペース情報を取得
    console.log('Calling getSpaces with params:', params);
    const spacesResult = await wrikeApi.getSpaces(params);
    console.log('Spaces result data length:', spacesResult.data.length);

    // ルートフォルダ情報を一度に取得（パーマリンク情報を含む）
    console.log('Calling getRootFolders to get permalinks');
    const foldersResult = await wrikeApi.getRootFolders();
    console.log('Root folders result data length:', foldersResult.data.length);

    // フォルダIDをキーとしたマップを作成
    const folderMap = new Map();
    for (const folder of foldersResult.data) {
      folderMap.set(folder.id, folder);
    }

    // スペース情報にパーマリンク情報を追加
    for (const space of spacesResult.data) {
      const folder = folderMap.get(space.id);
      if (folder && folder.permalink) {
        space.permalink = folder.permalink;
        console.log(`Space ${space.id} permalink: ${space.permalink}`);
      }
    }

    // 次のページのトークンを保存
    if (spacesResult.nextPageToken) {
      if (!req.session.spacePageTokens) {
        req.session.spacePageTokens = {};
      }
      req.session.spacePageTokens[page + 1] = spacesResult.nextPageToken;
    }

    // 総ページ数を計算（推定）
    const totalPages = Math.max(page, spacesResult.nextPageToken ? page + 1 : page);

    res.render('spaces', {
      title: 'Spaces',
      spaces: spacesResult.data,
      user: req.session.userInfo,
      nextPageToken: spacesResult.nextPageToken,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    console.error('Error getting spaces:', error);
    res.render('error', {
      title: 'エラー',
      message: 'Failed to load spaces'
    });
  }
});

/**
 * Folders page - 無効化
 */
router.get('/folders', requireAuth, async (req, res) => {
  res.render('error', {
    title: 'エラー',
    message: 'フォルダ機能は現在無効化されています'
  });
});

/**
 * Tasks page
 */
router.get('/tasks', requireAuth, async (req, res) => {
  try {
    console.log('Tasks route called');
    // ページネーション用のパラメータを取得
    const page = parseInt(req.query.page as string) || 1;
    const pageTokens: { [key: number]: string } = req.session.taskPageTokens || {};

    // APIリクエストのパラメータを設定（pageSizeを1000に設定）
    const params: any = { pageSize: 1000 };
    if (page > 1 && pageTokens[page]) {
      params.nextPageToken = pageTokens[page];
    }

    console.log('Calling getTasks with params:', params);
    const result = await wrikeApi.getTasks(params);
    console.log('Tasks result data length:', result.data.length);
    if (result.data && result.data.length > 0) {
      console.log('First task object:', JSON.stringify(result.data[0], null, 2));
    }

    // 次のページのトークンを保存
    if (result.nextPageToken) {
      if (!req.session.taskPageTokens) {
        req.session.taskPageTokens = {};
      }
      req.session.taskPageTokens[page + 1] = result.nextPageToken;
    }

    // 総ページ数を計算（推定）
    const totalPages = Math.max(page, result.nextPageToken ? page + 1 : page);

    res.render('tasks', {
      title: 'タスク',
      tasks: result.data,
      user: req.session.userInfo,
      nextPageToken: result.nextPageToken,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.render('error', {
      title: 'エラー',
      message: 'タスクの読み込みに失敗しました'
    });
  }
});

/**
 * Users page
 */
router.get('/users', requireAuth, async (req, res) => {
  try {
    const result = await wrikeApi.getContacts();
    console.log('Users API response:', JSON.stringify(result, null, 2));

    res.render('users', {
      title: 'Users',
      users: result.data,
      user: req.session.userInfo
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load users'
    });
  }
});

/**
 * User import page
 */
router.get('/users/import', requireAuth, (req, res) => {
  res.render('user-import', {
    title: 'Import Users',
    user: req.session.userInfo
  });
});

/**
 * Folder detail page - 無効化
 */
router.get('/folders/:id', requireAuth, async (req, res) => {
  res.render('error', {
    title: 'エラー',
    message: 'フォルダ機能は現在無効化されています'
  });
});

/**
 * Tasks in folder page - 無効化
 */
router.get('/folders/:id/tasks', requireAuth, async (req, res) => {
  res.render('error', {
    title: 'エラー',
    message: 'フォルダ機能は現在無効化されています'
  });
});

/**
 * Space detail page - 無効化
 */
router.get('/spaces/:id', requireAuth, async (req, res) => {
  res.render('error', {
    title: 'エラー',
    message: 'スペース詳細機能は現在無効化されています'
  });
});

export default router;
