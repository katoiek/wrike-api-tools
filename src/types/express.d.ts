import { I18n } from 'i18n';

// Extend Express Request interface to include i18n methods
// Expressのリクエストインターフェースを拡張してi18nメソッドを含める
declare global {
  namespace Express {
    interface Request {
      __: I18n['__'];
      __n: I18n['__n'];
      getLocale: () => string;
      setLocale: (locale: string) => void;
    }
  }
}
