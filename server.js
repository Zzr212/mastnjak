const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const os = require('os'); // Added to check network interfaces

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "dashboard_driver_secret_key_change_in_prod";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

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
    rate_per_km REAL DEFAULT 0.12
  )`);

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

  // Austria Tracking
  db.run(`CREATE TABLE IF NOT EXISTS austria_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT,
    total_seconds INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 0, 
    last_start_timestamp INTEGER
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

// Health Check (Use this to test connection: http://IP:3000/health)
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
      res.json({ token, rate_per_km: user.rate_per_km });
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
    austria: { total_seconds: 0, is_active: false, last_start_timestamp: null },
    settings: { rate_per_km: 0.12 }
  };

  db.serialize(() => {
    // Get Settings
    db.get(`SELECT rate_per_km FROM users WHERE id = ?`, [userId], (err, row) => {
      if (row) response.settings.rate_per_km = row.rate_per_km;
    });

    // Get Austria Status for Today
    db.get(`SELECT * FROM austria_logs WHERE user_id = ? AND date = ?`, [userId, today], (err, row) => {
      if (row) {
        response.austria = {
          total_seconds: row.total_seconds,
          is_active: !!row.is_active,
          last_start_timestamp: row.last_start_timestamp
        };
      }
    });

    // Get Recent Logs (Last 30 days)
    db.all(`SELECT * FROM daily_logs WHERE user_id = ? ORDER BY date DESC LIMIT 30`, [userId], (err, rows) => {
      response.logs = rows || [];
      res.json(response);
    });
  });
});

// Update Settings
app.post('/api/settings', authenticateToken, (req, res) => {
  const { rate_per_km } = req.body;
  db.run(`UPDATE users SET rate_per_km = ? WHERE id = ?`, [rate_per_km, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Add Daily Log
app.post('/api/logs', authenticateToken, (req, res) => {
  const { date, start_km, end_km, wage, total_earnings } = req.body;
  // Check if log exists for date, if so update, else insert
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
});

// Toggle Austria
app.post('/api/austria/toggle', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  const userId = req.user.id;

  db.get(`SELECT * FROM austria_logs WHERE user_id = ? AND date = ?`, [userId, today], (err, row) => {
    if (!row) {
      // First time today, starting
      db.run(`INSERT INTO austria_logs (user_id, date, total_seconds, is_active, last_start_timestamp) VALUES (?, ?, 0, 1, ?)`,
        [userId, today, now], (err) => res.json({ success: true, is_active: true, total_seconds: 0 }));
    } else {
      if (row.is_active) {
        // Stopping
        const addedSeconds = Math.floor((now - row.last_start_timestamp) / 1000);
        const newTotal = row.total_seconds + addedSeconds;
        db.run(`UPDATE austria_logs SET total_seconds = ?, is_active = 0, last_start_timestamp = NULL WHERE id = ?`,
          [newTotal, row.id], (err) => res.json({ success: true, is_active: false, total_seconds: newTotal }));
      } else {
        // Starting again
        db.run(`UPDATE austria_logs SET is_active = 1, last_start_timestamp = ? WHERE id = ?`,
          [now, row.id], (err) => res.json({ success: true, is_active: true, total_seconds: row.total_seconds }));
      }
    }
  });
});

// Catch-all for React
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("App not built. Run 'npm run build' first.");
  }
});

// Listen on 0.0.0.0 to accept external connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`-------------------------------------------`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Access locally: http://localhost:${PORT}`);
  
  // Log all network interfaces to help debugging
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
          if (net.family === 'IPv4' && !net.internal) {
              console.log(`Access externally: http://${net.address}:${PORT}`);
          }
      }
  }
  console.log(`-------------------------------------------`);
});