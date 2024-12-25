// config/db.js
const mysql = require('mysql2');

// Create the MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: "",
  database: "taxDashboard_db",
});

module.exports = pool.promise(); // Using promise-based queries