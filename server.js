const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "dashboard_driver_secret_key_change_in_prod";

// Middleware
app.use(cors());
app.use(express.json());

// Static files (Frontend)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Static files (Uploads)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Database Setup
const dbDataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDataDir)){
    fs.mkdirSync(dbDataDir);
}
const db = new sqlite3.Database(path.join(dbDataDir, 'driver.db'));

db.serialize(() => {
  // Users Table Update
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    rate_per_km REAL DEFAULT 0.12,
    language TEXT DEFAULT 'en',
    profile_image TEXT,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME
  )`);
  
  // Migrations
  const columns = ['language', 'profile_image', 'cover_image', 'created_at', 'last_active'];
  db.all("PRAGMA table_info(users)", (err, rows) => {
    const existing = rows.map(r => r.name);
    columns.forEach(col => {
      if (!existing.includes(col)) {
        let type = 'TEXT';
        let def = '';
        if (col === 'created_at') def = "DEFAULT CURRENT_TIMESTAMP";
        db.run(`ALTER TABLE users ADD COLUMN ${col} ${type} ${def}`);
      }
    });
  });

  // Other Tables
  db.run(`CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT,
    start_km REAL,
    end_km REAL,
    wage REAL,
    total_earnings REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS austria_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT,
    total_seconds INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 0, 
    last_start_timestamp INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS austria_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    start_time INTEGER,
    end_time INTEGER,
    duration INTEGER,
    date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    reminder_date TEXT,
    is_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// Health Check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Register (Updated to return token)
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  
  db.run(`INSERT INTO users (username, password, created_at, last_active) VALUES (?, ?, ?, ?)`, 
    [username, hashedPassword, now, now], function(err) {
    if (err) return res.status(400).json({ error: "Username already exists" });
    
    // Auto-login logic immediately after register
    const userId = this.lastID;
    const token = jwt.sign({ id: userId, username: username }, SECRET_KEY);
    res.json({ message: "User created", token, username, language: 'en' });
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: "User not found" });
    
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
      
      // Update last_active
      const now = new Date().toISOString();
      db.run(`UPDATE users SET last_active = ? WHERE id = ?`, [now, user.id]);

      res.json({ token, rate_per_km: user.rate_per_km, username: user.username, language: user.language || 'en' });
    } else {
      res.status(403).json({ error: "Invalid password" });
    }
  });
});

// Upload Image
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const type = req.body.type; // 'profile' or 'cover'
  const filePath = '/uploads/' + req.file.filename;
  
  const col = type === 'cover' ? 'cover_image' : 'profile_image';
  
  // Get old image to delete it (optional cleanup)
  db.get(`SELECT ${col} FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (row && row[col]) {
        const oldPath = path.join(__dirname, row[col]);
        if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
    }
  });

  db.run(`UPDATE users SET ${col} = ? WHERE id = ?`, [filePath, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ path: filePath });
  });
});

// Public Users (For Landing Page)
app.get('/api/public/users', (req, res) => {
  db.all(`SELECT username, profile_image, created_at, last_active FROM users ORDER BY last_active DESC LIMIT 20`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Dashboard Data
app.get('/api/data', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const userId = req.user.id;

  const response = {
    logs: [],
    austria_logs: [],
    austria_sessions: [],
    notes: [],
    austria: { total_seconds: 0, is_active: false, last_start_timestamp: null },
    settings: { rate_per_km: 0.12, language: 'en' },
    user_info: {}
  };

  db.serialize(() => {
    // Get Settings & User Info
    db.get(`SELECT rate_per_km, language, profile_image, cover_image, created_at FROM users WHERE id = ?`, [userId], (err, row) => {
      if (row) {
        response.settings.rate_per_km = row.rate_per_km;
        response.settings.language = row.language || 'en';
        response.user_info = {
            profile_image: row.profile_image,
            cover_image: row.cover_image,
            created_at: row.created_at
        };
      }
    });

    // ... rest of data fetching ...
    // Get Notes
    db.all(`SELECT * FROM notes WHERE user_id = ? ORDER BY reminder_date ASC`, [userId], (err, rows) => {
      response.notes = rows || [];
    });
    // Get Austria Status
    db.get(`SELECT * FROM austria_logs WHERE user_id = ? AND date = ?`, [userId, today], (err, row) => {
      if (row) {
        response.austria = {
          total_seconds: row.total_seconds,
          is_active: !!row.is_active,
          last_start_timestamp: row.last_start_timestamp
        };
      }
    });
    // Logs
    db.all(`SELECT * FROM austria_logs WHERE user_id = ? ORDER BY date DESC LIMIT 90`, [userId], (err, rows) => {
      response.austria_logs = rows || [];
    });
    db.all(`SELECT * FROM austria_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT 200`, [userId], (err, rows) => {
      response.austria_sessions = rows || [];
    });
    db.all(`SELECT * FROM daily_logs WHERE user_id = ? ORDER BY date DESC LIMIT 90`, [userId], (err, rows) => {
      response.logs = rows || [];
      res.json(response);
    });
  });
});

// Update Settings
app.post('/api/settings', authenticateToken, (req, res) => {
  const { rate_per_km, language } = req.body;
  if (rate_per_km !== undefined) db.run(`UPDATE users SET rate_per_km = ? WHERE id = ?`, [rate_per_km, req.user.id]);
  if (language !== undefined) db.run(`UPDATE users SET language = ? WHERE id = ?`, [language, req.user.id]);
  res.json({ success: true });
});

// Notes Routes
app.post('/api/notes', authenticateToken, (req, res) => {
  const { content, reminder_date } = req.body;
  db.run(`INSERT INTO notes (user_id, content, reminder_date) VALUES (?, ?, ?)`, 
    [req.user.id, content, reminder_date], (err) => res.json({success: true}));
});
app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err) => res.json({success: true}));
});

// Austria Session Delete Route
app.delete('/api/austria/session/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM austria_sessions WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ success: true });
  });
});

// Logs & Austria Routes (Kept same as before)
app.post('/api/logs', authenticateToken, (req, res) => {
  const { id, date, start_km, end_km, wage, total_earnings } = req.body;
  if (id) {
    db.run(`UPDATE daily_logs SET start_km=?, end_km=?, wage=?, total_earnings=? WHERE id=? AND user_id=?`,
      [start_km, end_km, wage, total_earnings, id, req.user.id], (err) => res.json({ success: true }));
  } else {
    db.get(`SELECT id FROM daily_logs WHERE user_id = ? AND date = ?`, [req.user.id, date], (err, row) => {
      if (row) {
        db.run(`UPDATE daily_logs SET start_km=?, end_km=?, wage=?, total_earnings=? WHERE id=?`,
          [start_km, end_km, wage, total_earnings, row.id], (err) => res.json({ success: true }));
      } else {
        db.run(`INSERT INTO daily_logs (user_id, date, start_km, end_km, wage, total_earnings) VALUES (?,?,?,?,?,?)`,
          [req.user.id, date, start_km, end_km, wage, total_earnings], (err) => res.json({ success: true }));
      }
    });
  }
});

app.post('/api/austria/toggle', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  const userId = req.user.id;
  db.get(`SELECT * FROM austria_logs WHERE user_id = ? AND date = ?`, [userId, today], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO austria_logs (user_id, date, total_seconds, is_active, last_start_timestamp) VALUES (?, ?, 0, 1, ?)`,
        [userId, today, now], (err) => res.json({ success: true, is_active: true, total_seconds: 0 }));
    } else {
      if (row.is_active) {
        const startTime = row.last_start_timestamp;
        const duration = Math.floor((now - startTime) / 1000);
        const newTotal = row.total_seconds + duration;
        db.run(`UPDATE austria_logs SET total_seconds = ?, is_active = 0, last_start_timestamp = NULL WHERE id = ?`,
          [newTotal, row.id], () => {
            db.run(`INSERT INTO austria_sessions (user_id, start_time, end_time, duration, date) VALUES (?, ?, ?, ?, ?)`,
              [userId, startTime, now, duration, today], () => res.json({ success: true, is_active: false, total_seconds: newTotal }));
          });
      } else {
        db.run(`UPDATE austria_logs SET is_active = 1, last_start_timestamp = ? WHERE id = ?`,
          [now, row.id], () => res.json({ success: true, is_active: true, total_seconds: row.total_seconds }));
      }
    }
  });
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send("App not built.");
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));