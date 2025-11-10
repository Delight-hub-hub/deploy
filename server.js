// ==========================
// server.js - Complete Setup
// ==========================

// ===== Imports =====
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./db'); // SQLite connection (make sure db.js exports the db)
const transporter = require('./emailConfig'); // Email transporter setup (NodeMailer)

// ===== App Setup =====
const app = express();
const PORT = 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'your-secret-key', // change this to something secure
  resave: false,
  saveUninitialized: true
}));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// ===== Login Protection Middleware =====
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect('/admin-login.html');
  }
}

// ===== Database Table Setup =====
db.run(`CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  phone TEXT,
  project_type TEXT,
  location TEXT,
  site_status TEXT,
  project_size TEXT,
  urgency TEXT,
  hire_status TEXT,
  timeline TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// ===== Routes =====

// ---- Contact Form ----
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  db.run('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
    [name, email, message],
    function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Database error.' });
      }
      res.status(201).json({ message: 'Contact saved successfully.', id: this.lastID });
    });
});

// ---- Quote Form ----
app.post('/quote', (req, res) => {
  const {
    name, email, phone, project_type, location,
    site_status, project_size, urgency, hire_status, timeline, description
  } = req.body;

  if (!name || !email || !phone || !project_type || !location) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  const sql = `
    INSERT INTO quotes (
      name, email, phone, project_type, location,
      site_status, project_size, urgency, hire_status, timeline, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    name, email, phone, project_type, location,
    site_status, project_size, urgency, hire_status, timeline, description
  ];

  db.run(sql, values, function(err) {
    if (err) {
      console.error('Database Error:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to submit quote request' });
    }

    // Send Email Notification
    const mailOptions = {
      from: 'brickand25@gmail.com',
      to: 'delightking03@gmail.com',
      subject: '🧱 New Quote Request Received - Code Brick',
      text: `
New Quote Request Received:

Name: ${name}
Email: ${email}
Phone: ${phone}
Project Type: ${project_type}
Location: ${location}
Site Condition: ${site_status}
Estimated Size: ${project_size}
Urgency: ${urgency}
Hiring Status: ${hire_status}
Estimated Timeline: ${timeline}

Project Description:
${description}

Submitted on: ${new Date().toLocaleString()}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background-color: #b22222; color: white; padding: 16px; text-align: center;">
              <h2 style="margin: 0;">Code Brick</h2>
              <p style="margin: 0;">New Quote Request</p>
            </div>
            <div style="padding: 20px;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Project Type:</strong> ${project_type}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Site Condition:</strong> ${site_status}</p>
              <p><strong>Estimated Size:</strong> ${project_size}</p>
              <p><strong>Urgency:</strong> ${urgency}</p>
              <p><strong>Hiring Status:</strong> ${hire_status}</p>
              <p><strong>Estimated Timeline:</strong> ${timeline}</p>
              <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">
              <h4>Project Description:</h4>
              <p style="white-space: pre-line;">${description}</p>
              <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">
              <p style="font-size: 12px; color: #555;">Submitted on: ${new Date().toLocaleString()}</p>
            </div>
            <div style="background-color: #f1f1f1; text-align: center; padding: 10px;">
              <p style="margin: 0; font-size: 12px; color: #777;">© 2025 Brick And (PTY) LTD Construction and Projects</p>
            </div>
          </div>
        </div>
      `
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) console.error('Email failed:', error);
      else console.log('Email sent: ' + info.response);
    });

    res.json({ success: true, message: 'Quote request submitted successfully!' });
  });
});

// ---- Admin Panel (protected) ----
app.get('/admin', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/data', requireLogin, (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.json(rows);
  });
});

app.get('/admin/quotes', requireLogin, (req, res) => {
  db.all('SELECT * FROM quotes ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.json(rows);
  });
});

// ---- Logout ----
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin-login.html');
});

// ---- Clean URLs for .html files ----
app.get('/:page', (req, res, next) => {
  const forbiddenRoutes = ['admin', 'logout', 'contact', 'quote', 'favicon.ico', 'admin-login'];
  if (forbiddenRoutes.includes(req.params.page)) return next();
  const filePath = path.join(__dirname, 'public', `${req.params.page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
