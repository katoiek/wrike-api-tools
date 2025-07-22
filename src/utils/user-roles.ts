/**
 * ユーザーロール判定ユーティリティ
 */

export interface UserProfile {
  accountId: string;
  role: string;
  external: boolean;
  admin: boolean;
  owner: boolean;
  active: boolean;
  email?: string;
  title?: string;
}

export interface UserRoleInfo {
  displayRole: string;
  roleClass: string;
  priority: number; // 優先度（高い値が優先）
  isExternal: boolean;
  isAdmin: boolean;
  isOwner: boolean;
}

/**
 * プロファイル情報から適切なRoleを判定する
 * @param profile ユーザープロファイル
 * @returns ロール情報
 */
export function determineUserRole(profile: UserProfile): UserRoleInfo {
  // 優先度順で判定
  // 1. Owner（最優先）
  if (profile.owner) {
    return {
      displayRole: 'Owner',
      roleClass: 'bg-danger',
      priority: 5,
      isExternal: false,
      isAdmin: true, // ownerの場合は必ずadminもtrue
      isOwner: true
    };
  }

  // 2. Administrator
  if (profile.admin) {
    return {
      displayRole: 'Administrator',
      roleClass: 'bg-warning',
      priority: 4,
      isExternal: false,
      isAdmin: true,
      isOwner: false
    };
  }

  // 3. External user
  if (profile.external) {
    return {
      displayRole: 'External user',
      roleClass: 'bg-secondary',
      priority: 3,
      isExternal: true,
      isAdmin: false,
      isOwner: false
    };
  }

  // 4. Regular user または Collaborator
  // profileのroleフィールドから判定
  if (profile.role) {
    const roleLower = profile.role.toLowerCase();

    if (roleLower === 'user' || roleLower === 'regular' || roleLower === 'regular user') {
      return {
        displayRole: 'Regular user',
        roleClass: 'bg-primary',
        priority: 2,
        isExternal: false,
        isAdmin: false,
        isOwner: false
      };
    }

    if (roleLower === 'collaborator' || roleLower === 'collab') {
      return {
        displayRole: 'Collaborator',
        roleClass: 'bg-success',
        priority: 1,
        isExternal: false,
        isAdmin: false,
        isOwner: false
      };
    }
  }

  // 5. デフォルト（詳細不明の場合）
  return {
    displayRole: 'Regular user',
    roleClass: 'bg-primary',
    priority: 2,
    isExternal: false,
    isAdmin: false,
    isOwner: false
  };
}

/**
 * ユーザーの最も優先度の高いロールを取得
 * @param profiles ユーザープロファイル配列
 * @returns 最も重要なロール情報
 */
export function getUserPrimaryRole(profiles: UserProfile[]): UserRoleInfo {
  if (!profiles || profiles.length === 0) {
    return {
      displayRole: 'Regular user',
      roleClass: 'bg-primary',
      priority: 2,
      isExternal: false,
      isAdmin: false,
      isOwner: false
    };
  }

  // 各プロファイルのロール情報を取得
  const roleInfos = profiles.map(profile => determineUserRole(profile));

  // 最も優先度の高いロールを選択
  const primaryRole = roleInfos.reduce((highest, current) =>
    current.priority > highest.priority ? current : highest
  );

  return primaryRole;
}

/**
 * ユーザーの全てのロール情報を取得
 * @param profiles ユーザープロファイル配列
 * @returns 全てのロール情報
 */
export function getAllUserRoles(profiles: UserProfile[]): UserRoleInfo[] {
  if (!profiles || profiles.length === 0) {
    return [];
  }

  return profiles.map(profile => determineUserRole(profile));
}

/**
 * 日本語版のロール名を取得
 * @param roleInfo ロール情報
 * @returns 日本語のロール名
 */
export function getJapaneseRoleName(roleInfo: UserRoleInfo): string {
  const roleMap: { [key: string]: string } = {
    'Owner': 'オーナー',
    'Administrator': '管理者',
    'External user': '外部ユーザー',
    'Regular user': '正規ユーザー',
    'Collaborator': 'コラボレーター'
  };

  return roleMap[roleInfo.displayRole] || roleInfo.displayRole;
}

/**
 * ロール情報から統計用のカテゴリを取得
 * @param roleInfo ロール情報
 * @returns 統計カテゴリ
 */
export function getRoleCategory(roleInfo: UserRoleInfo): string {
  if (roleInfo.isOwner) return 'owner';
  if (roleInfo.isAdmin) return 'admin';
  if (roleInfo.isExternal) return 'external';
  if (roleInfo.displayRole === 'Collaborator') return 'collaborator';
  return 'regular';
}
