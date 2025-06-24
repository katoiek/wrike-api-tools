import 'express-session';

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    userInfo?: any;
    spacePageTokens?: { [key: number]: string };
    folderPageTokens?: { [key: number]: string };
    taskPageTokens?: { [key: number]: string };
    customFieldsPageTokens?: { [key: number]: string };
  }
}
