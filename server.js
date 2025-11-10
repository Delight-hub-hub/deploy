require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./db'); // SQLite connection
const transporter = require('./emailConfig');


const app = express();
const PORT = 3000;

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// Serve static files (HTML, CSS, JS) from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// === Login Protection Middleware ===
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect('/admin-login.html');
  }
}

// =============================
// Contact Form Submission Route
// =============================
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const stmt = db.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)');
    const info = stmt.run(name, email, message);
    res.status(201).json({
      message: 'Contact saved successfully.',
      id: info.lastInsertRowid
    });
  } catch (err) {
    console.error('Insert Error:', err.message);
    res.status(500).json({ error: 'Database error.' });
  }
});

db.exec(`CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  phone TEXT,
  project_type TEXT,
  location TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.post('/quote', (req, res) => {
  const { name, email, phone, project_type, location, description } = req.body;

  try {
    const stmt = db.prepare('INSERT INTO quotes (name, email, phone, project_type, location, description) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(name, email, phone, project_type, location, description);

    // === Send Email ===
    const mailOptions = {
      from: 'brickand25@gmail.com',
      to: 'delightking03@gmail.com',
      subject: 'New Quote Request Submitted',
      text: `
New Quote Request Received:

Name: ${name}
Email: ${email}
Phone: ${phone}
Project Type: ${project_type}
Location: ${location}
Description: ${description}
      `
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.error('Email failed:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.json({ success: true, message: 'Quote request submitted successfully!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Failed to submit quote request' });
  }
});




// ===========================
// Admin Panel - Protected Page
// ===========================
app.get('/admin', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// =====================================
// Admin API - Fetch Contact Submissions
// =====================================
app.get('/admin/data', requireLogin, (req, res) => {
  try {
    const stmt = db.prepare('SELECT name, email, message FROM contacts ORDER BY id DESC');
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    console.error('DB Error:', err.message);
    res.status(500).json({ error: 'Database error.' });
  }
});

app.get('/admin/quotes', requireLogin, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM quotes ORDER BY id DESC');
    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    console.error('DB Error (quotes):', err.message);
    res.status(500).json({ error: 'Database error.' });
  }
});

// =====================
// Admin Logout
// =====================
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin-login.html');
});

// === Clean URLs: Serve all .html files without .html in URL ===
app.get('/:page', (req, res, next) => {
  // Avoid clashing with known routes like /admin, /logout, /contact, /quote
  const forbiddenRoutes = ['admin', 'logout', 'contact', 'quote', 'favicon.ico', 'admin-login'];

  if (forbiddenRoutes.includes(req.params.page)) return next();

  const filePath = path.join(__dirname, 'public', `${req.params.page}.html`);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.warn(`Page not found: ${req.params.page}`);
      next(); // let your 404 handler take care of this
    }
  });
});


// =====================
// Start Server
// =====================
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
