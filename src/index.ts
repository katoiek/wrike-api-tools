import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import fs from 'fs';
// import { initializeDatabase } from './database/init'; // SQLite削除のため不要
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';
import viewRoutes from './routes/views';
import languageRoutes from './routes/language';
import i18nConfig from './config/i18n';

// Load environment variables
dotenv.config();

// Initialize the application
const app = express();
const port = process.env.PORT || 3000;

// Configure middleware
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// For development mode, use src/views directly
if (process.env.NODE_ENV === 'development' && fs.existsSync(path.join(__dirname, '../src/views'))) {
  app.set('views', path.join(__dirname, '../src/views'));
}

// Set up public directory
let publicDir = path.join(__dirname, 'public');

// For development mode, use src/public directly if it exists
if (process.env.NODE_ENV === 'development' && fs.existsSync(path.join(__dirname, '../src/public'))) {
  publicDir = path.join(__dirname, '../src/public');
}

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create CSS and JS directories
const cssDir = path.join(publicDir, 'css');
const jsDir = path.join(publicDir, 'js');
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
}
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

// Create basic CSS file if it doesn't exist
const cssFile = path.join(cssDir, 'styles.css');
if (!fs.existsSync(cssFile)) {
  fs.writeFileSync(cssFile, `
    /* Custom styles */
    .card {
      margin-bottom: 20px;
    }
    .table-responsive {
      overflow-x: auto;
    }
  `);
}

// Create basic JS file if it doesn't exist
const jsFile = path.join(jsDir, 'main.js');
if (!fs.existsSync(jsFile)) {
  fs.writeFileSync(jsFile, `
    // Main JavaScript file
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Wrike API Tools loaded');
    });
  `);
}

app.use(express.static(publicDir));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize i18n middleware
// i18nミドルウェアを初期化
app.use(i18nConfig.init);

// Add middleware to check cookie and set locale on each request
app.use((req, res, next) => {
  // First check if we have a cookie set
  const cookieLang = req.cookies?.lang;
  if (cookieLang && ['en', 'ja'].includes(cookieLang) && typeof req.setLocale === 'function') {
    req.setLocale(cookieLang);
    console.log(`Set locale from cookie: ${cookieLang}`);
    return next();
  }

  // If no cookie is set, check browser language
  const acceptLanguage = req.headers['accept-language'] || '';
  console.log(`Browser accept-language: ${acceptLanguage}`);

  // Parse the Accept-Language header
  const browserLangs = acceptLanguage.split(',')
    .map(lang => lang.split(';')[0].trim().toLowerCase())
    .filter(Boolean);

  console.log(`Parsed browser languages: ${browserLangs.join(', ')}`);

  // Check if Japanese is one of the preferred languages
  const preferJapanese = browserLangs.some(lang =>
    lang === 'ja' || lang.startsWith('ja-')
  );

  // Set language based on browser preference
  const detectedLang = preferJapanese ? 'ja' : 'en';
  console.log(`Detected language from browser: ${detectedLang}`);

  // Set the language in cookie
  res.cookie('lang', detectedLang, {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    httpOnly: false,
    path: '/'
  });

  // Set locale using i18n method
  if (typeof req.setLocale === 'function') {
    req.setLocale(detectedLang);
  }

  next();
});

// Make i18n available to all templates
// すべてのテンプレートでi18nを利用可能にする
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Add i18n functions to response locals for templates
  res.locals.__ = req.__;
  res.locals.__n = req.__n;

  // Add getLocale function to templates
  res.locals.getLocale = () => {
    // First try to get from request
    if (typeof req.getLocale === 'function') {
      return req.getLocale();
    }

    // Fallback to cookie
    const cookieLang = req.cookies?.lang;
    if (cookieLang && ['en', 'ja'].includes(cookieLang)) {
      return cookieLang;
    }

    // Default to English (this should rarely be reached now)
    return 'en';
  };

  // Log current locale for debugging
  console.log(`Current locale: ${res.locals.getLocale()}`);

  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database
async function initialize() {
  try {
    // await initializeDatabase(); // SQLite削除のため不要
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize:', err);
    process.exit(1);
  }
}

// Register routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/language', languageRoutes);
app.use('/language', languageRoutes);
app.use('/', viewRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: req.__('error.title'),
    message: req.__('error.message'),
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Initialize and start the server
initialize().then(() => {
  app.listen(port, () => {
    console.log(`サーバーが起動しました: http://localhost:${port}`);
  });
});
