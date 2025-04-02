import { I18n } from 'i18n';
import path from 'path';

/**
 * Configure internationalization settings
 * 国際化設定を構成する
 */
const i18nConfig = new I18n({
  // Setup locales - add more as needed
  // ロケールの設定 - 必要に応じて追加
  locales: ['en', 'ja'],

  // Default locale
  // デフォルトのロケール
  defaultLocale: 'ja',

  // Directory where language json files are stored
  // 言語JSONファイルが保存されているディレクトリ
  directory: path.join(process.cwd(), 'locales'),

  // Auto reload language files when changed
  // 変更時に言語ファイルを自動的にリロード
  autoReload: true,

  // Query parameter to switch locale (e.g., ?lang=en)
  // ロケールを切り替えるためのクエリパラメータ（例：?lang=en）
  queryParameter: 'lang',

  // Cookie name to store user's preferred language
  // ユーザーの優先言語を保存するCookie名
  cookie: 'lang',

  // Set cookie expiration to 1 year (not directly supported by i18n, we handle in route)
  // Cookieの有効期限を1年に設定（i18nで直接サポートされていないため、ルートで処理）

  // Update files when new phrases are detected
  // 新しいフレーズが検出されたときにファイルを更新
  updateFiles: false,

  // Sync language files on startup
  // 起動時に言語ファイルを同期
  syncFiles: false,

  // Use object notation for translations
  // 翻訳にオブジェクト表記を使用
  objectNotation: true
});

export default i18nConfig;
