const Database = require('better-sqlite3');
const db = new Database('./codebrick.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    project_type TEXT NOT NULL,
    location TEXT NOT NULL,
    site_status TEXT NOT NULL,
    project_size TEXT NOT NULL,
    urgency TEXT NOT NULL,
    hire_status TEXT NOT NULL,
    timeline TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function ensureColumn(table, column, type) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = info.some((col) => col.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

ensureColumn('quotes', 'site_status', 'TEXT');
ensureColumn('quotes', 'project_size', 'TEXT');
ensureColumn('quotes', 'urgency', 'TEXT');
ensureColumn('quotes', 'hire_status', 'TEXT');
ensureColumn('quotes', 'timeline', 'TEXT');
ensureColumn('quotes', 'description', 'TEXT');

module.exports = db;
