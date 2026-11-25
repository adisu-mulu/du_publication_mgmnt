require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'du_publication_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (process.env.DB_SOCKET) {
    config.socketPath = process.env.DB_SOCKET;
} else if (process.env.DB_HOST) {
    config.host = process.env.DB_HOST;
    if (process.env.DB_PORT) config.port = Number(process.env.DB_PORT);
} else {
    config.host = 'localhost';
}

const pool = mysql.createPool(config);

module.exports = pool;
