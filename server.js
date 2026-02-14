const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "dashboard_driver_secret_key_change_in_prod";

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  console.warn("WARNING: 'dist' folder not found. Run 'npm run build' to generate frontend assets.");
}

// Database Setup
const dbDataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDataDir)){
    fs.mkdirSync(dbDataDir);
}
const db = new sqlite3.Database(path.join(dbDataDir, 'driver.db'));

db.serialize(() => {
  // Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    rate_per_km REAL DEFAULT 0.12,
    language TEXT DEFAULT 'en'
  )`);
  
  // Migration for language column if it doesn't exist (Simple check)
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (!rows.some(col => col.name === 'language')) {
      db.run("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en'");
    }
  });

  // Daily Logs (Earnings)
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

  // Austria Daily Aggregates
  db.run(`CREATE TABLE IF NOT EXISTS austria_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT,
    total_seconds INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 0, 
    last_start_timestamp INTEGER
  )`);

  // Austria Sessions
  db.run(`CREATE TABLE IF NOT EXISTS austria_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    start_time INTEGER,
    end_time INTEGER,
    duration INTEGER,
    date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Notes / Reminders
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

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
    if (err) return res.status(400).json({ error: "Username already exists" });
    res.json({ message: "User created" });
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: "User not found" });
    
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
      res.json({ token, rate_per_km: user.rate_per_km, username: user.username, language: user.language || 'en' });
    } else {
      res.status(403).json({ error: "Invalid password" });
    }
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
    settings: { rate_per_km: 0.12, language: 'en' }
  };

  db.serialize(() => {
    // Get Settings
    db.get(`SELECT rate_per_km, language FROM users WHERE id = ?`, [userId], (err, row) => {
      if (row) {
        response.settings.rate_per_km = row.rate_per_km;
        response.settings.language = row.language || 'en';
      }
    });

    // Get Notes (Active or Future)
    db.all(`SELECT * FROM notes WHERE user_id = ? ORDER BY reminder_date ASC`, [userId], (err, rows) => {
      response.notes = rows || [];
    });

    // Get Today's Austria Status
    db.get(`SELECT * FROM austria_logs WHERE user_id = ? AND date = ?`, [userId, today], (err, row) => {
      if (row) {
        response.austria = {
          total_seconds: row.total_seconds,
          is_active: !!row.is_active,
          last_start_timestamp: row.last_start_timestamp
        };
      }
    });

    // Get Recent Austria Logs
    db.all(`SELECT * FROM austria_logs WHERE user_id = ? ORDER BY date DESC LIMIT 90`, [userId], (err, rows) => {
      response.austria_logs = rows || [];
    });

    // Get Recent Austria Sessions
    db.all(`SELECT * FROM austria_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT 200`, [userId], (err, rows) => {
      response.austria_sessions = rows || [];
    });

    // Get Recent Earnings Logs
    db.all(`SELECT * FROM daily_logs WHERE user_id = ? ORDER BY date DESC LIMIT 90`, [userId], (err, rows) => {
      response.logs = rows || [];
      res.json(response);
    });
  });
});

// Update Settings (Rate & Language)
app.post('/api/settings', authenticateToken, (req, res) => {
  const { rate_per_km, language } = req.body;
  
  if (rate_per_km !== undefined) {
    db.run(`UPDATE users SET rate_per_km = ? WHERE id = ?`, [rate_per_km, req.user.id]);
  }
  
  if (language !== undefined) {
    db.run(`UPDATE users SET language = ? WHERE id = ?`, [language, req.user.id]);
  }
  
  res.json({ success: true });
});

// Notes Routes
app.post('/api/notes', authenticateToken, (req, res) => {
  const { content, reminder_date } = req.body;
  db.run(`INSERT INTO notes (user_id, content, reminder_date) VALUES (?, ?, ?)`, 
    [req.user.id, content, reminder_date], (err) => {
      if(err) return res.status(500).json({error: err.message});
      res.json({success: true});
  });
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err) => {
    if(err) return res.status(500).json({error: err.message});
    res.json({success: true});
  });
});

// Add or Update Daily Log
app.post('/api/logs', authenticateToken, (req, res) => {
  const { id, date, start_km, end_km, wage, total_earnings } = req.body;
  
  if (id) {
    db.run(`UPDATE daily_logs SET start_km=?, end_km=?, wage=?, total_earnings=? WHERE id=? AND user_id=?`,
      [start_km, end_km, wage, total_earnings, id, req.user.id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ success: true });
      });
  } else {
    db.get(`SELECT id FROM daily_logs WHERE user_id = ? AND date = ?`, [req.user.id, date], (err, row) => {
      if (row) {
        db.run(`UPDATE daily_logs SET start_km=?, end_km=?, wage=?, total_earnings=? WHERE id=?`,
          [start_km, end_km, wage, total_earnings, row.id], (err) => {
            if (err) return res.status(500).json({error: err.message});
            res.json({ success: true });
          });
      } else {
        db.run(`INSERT INTO daily_logs (user_id, date, start_km, end_km, wage, total_earnings) VALUES (?,?,?,?,?,?)`,
          [req.user.id, date, start_km, end_km, wage, total_earnings], (err) => {
            if (err) return res.status(500).json({error: err.message});
            res.json({ success: true });
          });
      }
    });
  }
});

// Toggle Austria
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
          [newTotal, row.id], (err) => {
            db.run(`INSERT INTO austria_sessions (user_id, start_time, end_time, duration, date) VALUES (?, ?, ?, ?, ?)`,
              [userId, startTime, now, duration, today], (err2) => {
                res.json({ success: true, is_active: false, total_seconds: newTotal });
              });
          });
      } else {
        db.run(`UPDATE austria_logs SET is_active = 1, last_start_timestamp = ? WHERE id = ?`,
          [now, row.id], (err) => res.json({ success: true, is_active: true, total_seconds: row.total_seconds }));
      }
    }
  });
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("App not built. Run 'npm run build' first.");
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
              console.log(`External IP: http://${net.address}:${PORT}`);
          }
      }
  }
});