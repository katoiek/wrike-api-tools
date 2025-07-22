import express from 'express';
import { wrikeApi } from '../services/wrike-api';
import { getUserPrimaryRole, type UserProfile } from '../utils/user-roles';

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
      userGroups: 0,
      users: 0,
      folderBlueprints: 0,
      customFields: 0
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

    // Get user groups count
    try {
      // ユーザーグループの数を取得
      const userGroupsResult = await wrikeApi.getUserGroups();
      if (userGroupsResult && userGroupsResult.data) {
        // 親グループの数を表示
        stats.userGroups = userGroupsResult.data.length;
      }
    } catch (error) {
      console.error('Error getting user groups count:', error);
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

    // Get folder blueprints count
    try {
      const folderBlueprintsResult = await wrikeApi.getFolderBlueprints();
      if (folderBlueprintsResult && folderBlueprintsResult.data) {
        stats.folderBlueprints = folderBlueprintsResult.data.length;
      }
    } catch (error) {
      console.error('Error getting folder blueprints count:', error);
    }

    // Get custom fields count
    try {
      const customFieldsResult = await wrikeApi.getCustomFields();
      if (customFieldsResult && customFieldsResult.data) {
        stats.customFields = customFieldsResult.data.length;
      }
    } catch (error) {
      console.error('Error getting custom fields count:', error);
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
        userGroups: 0,
        users: 0,
        folderBlueprints: 0
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

    // 非同期データ読み込みを使用するため、初期データは空で表示
    res.render('spaces', {
      title: 'Spaces',
      user: req.session.userInfo,
      initialLoading: true
    });
  } catch (error) {
    console.error('Error rendering spaces page:', error);
    res.render('error', {
      title: 'エラー',
      message: 'Failed to load spaces page'
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
 * Tasks page - 無効化
 */
router.get('/tasks', requireAuth, async (req, res) => {
  res.render('error', {
    title: 'エラー',
    message: 'タスク機能は現在無効化されています'
  });
});

/**
 * Users page
 */
router.get('/users', requireAuth, async (req, res) => {
  try {
    const result = await wrikeApi.getContacts();

    // サンプルユーザーの構造をログに出力して確認
    if (result.data && result.data.length > 0) {
      console.log('Sample user structure:', JSON.stringify(result.data[0], null, 2));
    }

    // ユーザー情報の処理
    const processedUsers = result.data.map(user => {
      // プロファイル情報からメールアドレスを取得
      if (user.profiles && user.profiles.length > 0) {
        const profile = user.profiles[0];
        if (profile.email) {
          user.email = profile.email;
        }
        // タイトル（役割）を取得
        if (profile.title) {
          user.role = profile.title;
        }

        // プロファイル情報からロールを判定
        const roleInfo = getUserPrimaryRole(user.profiles as UserProfile[]);
        user.roleInfo = roleInfo;
        user.displayRole = roleInfo.displayRole;
      }
      return user;
    });

    res.render('users', {
      title: 'Users',
      users: processedUsers,
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
 * User export to CSV
 */
router.get('/users/export', requireAuth, async (req, res) => {
  try {
    // Get filter parameters from query
    const search = req.query.search as string || '';
    const status = req.query.status as string || 'active';
    const domain = req.query.domain as string || 'all';
    const name = req.query.name as string || 'all';
    const role = req.query.role as string || 'all';

    console.log(`Exporting users with filters - search: "${search}", status: ${status}, domain: ${domain}, name: ${name}, role: ${role}`);

    // Get all users
    const result = await wrikeApi.getContacts();

    // Process users (same as in the /users route)
    const processedUsers = result.data.map(user => {
      // Get email from profiles
      if (user.profiles && user.profiles.length > 0) {
        const profile = user.profiles[0];
        if (profile.email) {
          user.email = profile.email;
        }
        if (profile.title) {
          user.role = profile.title;
        }

        // プロファイル情報からロールを判定
        const roleInfo = getUserPrimaryRole(user.profiles as UserProfile[]);
        user.roleInfo = roleInfo;
        user.displayRole = roleInfo.displayRole;
      }
      return user;
    });

    // Apply filters
    const filteredUsers = processedUsers.filter(user => {
      // Search filter
      const matchesSearch = search === '' ||
        user.id.toLowerCase().includes(search.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(search.toLowerCase()));

      // Status filter
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && !user.deleted) ||
        (status === 'deleted' && user.deleted);

      // Name filter (free text)
      const matchesName = name === 'all' ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(name.toLowerCase());

      // Role filter
      const matchesRole = role === 'all' ||
        (user.displayRole && user.displayRole.toLowerCase().includes(role.toLowerCase()));

      // Domain filter
      let matchesDomain = true;
      if (domain !== 'all') {
        if (domain === 'has-email') {
          // メールアドレスが設定されている場合のみ
          matchesDomain = !!user.email && user.email.trim() !== '';
        } else if (domain === 'no-email') {
          // メールアドレスが設定されていない場合のみ
          matchesDomain = !user.email || user.email.trim() === '';
        } else if (user.email) {
          // 特定のドメインでフィルタリング
          const parts = user.email.split('@');
          matchesDomain = parts.length === 2 && parts[1].toLowerCase() === domain.toLowerCase();
        } else {
          matchesDomain = false;
        }
      }

      return matchesSearch && matchesStatus && matchesName && matchesRole && matchesDomain;
    });

    console.log(`Filtered ${processedUsers.length} users to ${filteredUsers.length} for export`);

    // Generate CSV content
    let csv = '\ufeff'; // BOM for UTF-8
    csv += 'ID,FirstName,LastName,Email,Role,Status\n';

    filteredUsers.forEach(user => {
      const status = user.deleted ?
        (req.getLocale() === 'en' ? 'Deleted' : '削除済み') :
        (req.getLocale() === 'en' ? 'Active' : 'アクティブ');

      const email = user.email || (req.getLocale() === 'en' ? 'Not set' : '未設定');
      const role = user.displayRole || (req.getLocale() === 'en' ? 'Regular user' : '正規ユーザー');

      // Escape fields that might contain commas
      const escapeCsv = (field: string | undefined): string => {
        if (field && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field || '';
      };

      csv += `${escapeCsv(user.id)},${escapeCsv(user.firstName)},${escapeCsv(user.lastName)},${escapeCsv(email)},${escapeCsv(role)},${escapeCsv(status)}\n`;
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=wrike_users.csv');

    // Send CSV content
    res.send(csv);
  } catch (error) {
    console.error('Error exporting users to CSV:', error);
    res.status(500).send('Failed to export users');
  }
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

/**
 * User detail page
 */
router.get('/users/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Fetching user details for ID: ${userId}`);

    // Get specific contact by ID using the direct endpoint
    const result = await wrikeApi.getContact(userId);

    if (!result || !result.data || result.data.length === 0) {
      console.error(`User with ID ${userId} not found`);
      return res.render('error', {
        title: 'Error',
        message: `User with ID ${userId} not found`
      });
    }

    const userDetail = result.data[0];

    // プロファイル情報からメールアドレスと役割を取得
    if (userDetail.profiles && userDetail.profiles.length > 0) {
      const profile = userDetail.profiles[0];
      if (profile.email) {
        userDetail.email = profile.email;
      }
      if (profile.title) {
        userDetail.role = profile.title;
      }

      // プロファイル情報からロールを判定
      const roleInfo = getUserPrimaryRole(userDetail.profiles as UserProfile[]);
      userDetail.roleInfo = roleInfo;
      userDetail.displayRole = roleInfo.displayRole;
    }

    console.log(`Found user: ${userDetail.firstName} ${userDetail.lastName}, Email: ${userDetail.email || '未設定'}, Role: ${userDetail.role || '未設定'}`);

    res.render('user-detail', {
      title: `User: ${userDetail.firstName} ${userDetail.lastName}`,
      userDetail,
      user: req.session.userInfo
    });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.render('error', {
      title: 'Error',
      message: 'Failed to load user details'
    });
  }
});

/**
 * User Groups page
 */
router.get('/user-groups', requireAuth, async (req, res) => {
  try {
    // Get user groups from Wrike API
    const result = await wrikeApi.getUserGroups();

    // Log detailed information about the response
    console.log('User groups count:', result.data.length);

    // Log detailed information about each group
    result.data.forEach((group, index) => {
      console.log(`Group ${index + 1}:`, group.title || group.name);
      console.log(`  ID: ${group.id}`);
      console.log(`  Members: ${group.members ? group.members.length : 0}`);
      console.log(`  Child Groups: ${group.childGroups ? group.childGroups.length : 0}`);
    });

    res.render('user-groups', {
      title: 'User Groups',
      userGroups: result.data,
      user: req.session.userInfo
    });
  } catch (error: any) {
    console.error('Error getting user groups:', error);

    // Check if it's a permission error (403)
    const isPermissionError = error.response && error.response.status === 403;
    const errorMessage = isPermissionError
      ? 'Permission denied: Your account does not have access to user groups'
      : 'Failed to load user groups';

    // Render the user-groups page with error information instead of generic error page
    res.render('user-groups', {
      title: 'User Groups',
      user: req.session.userInfo,
      error: errorMessage
    });
  }
});

/**
 * Custom Fields page
 */
router.get('/custom-fields', requireAuth, async (req, res) => {
  try {
    console.log('Custom Fields page route called');

    // Get page parameter for initial state
    const page = parseInt(req.query.page as string) || 1;

    res.render('custom-fields', {
      title: req.__('nav.customFields'),
      user: req.session.userInfo,
      currentPage: page
    });
  } catch (error) {
    console.error('Error getting custom fields:', error);
    res.render('error', {
      title: req.__('error.title'),
      message: req.__('customFields.error')
    });
  }
});

/**
 * Folder Blueprints page
 */
router.get('/folder-blueprints', requireAuth, async (req, res) => {
  try {
    // Get folder blueprints from Wrike API
    const result = await wrikeApi.getFolderBlueprints();

    // Log detailed information about the response
    console.log('Folder blueprints count:', result.data.length);

    res.render('folder-blueprints', {
      title: 'Folder Blueprints',
      folderBlueprints: result.data,
      user: req.session.userInfo
    });
  } catch (error: any) {
    console.error('Error getting folder blueprints:', error);

    // Check if it's a permission error (403)
    const isPermissionError = error.response && error.response.status === 403;
    const errorMessage = isPermissionError
      ? 'Permission denied: Your account does not have access to folder blueprints'
      : 'Failed to load folder blueprints';

    // Render the folder-blueprints page with error information
    res.render('folder-blueprints', {
      title: 'Folder Blueprints',
      user: req.session.userInfo,
      error: errorMessage
    });
  }
});



export default router;
