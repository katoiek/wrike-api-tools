import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import fs from 'fs';
import { initializeDatabase } from './database/init';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';
import viewRoutes from './routes/views';

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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database
async function initialize() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize:', err);
    process.exit(1);
  }
}

// Register routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'エラー',
    message: '内部サーバーエラーが発生しました',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Initialize and start the server
initialize().then(() => {
  app.listen(port, () => {
    console.log(`サーバーが起動しました: http://localhost:${port}`);
  });
});
