// Single shared connection to the SQLite file. Every route imports this
// instead of opening its own connection.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'recipeshare.db');
const db = new DatabaseSync(dbPath);

// Foreign keys are off by default in SQLite, turn them on so ON DELETE CASCADE works.
db.exec('PRAGMA foreign_keys = ON');

module.exports = db;
