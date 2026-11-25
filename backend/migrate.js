const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
    let connection;
    try {
        const config = {
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        };
        if (process.env.DB_SOCKET) config.socketPath = process.env.DB_SOCKET;
        else {
            config.host = process.env.DB_HOST || '127.0.0.1';
            if (process.env.DB_PORT) config.port = Number(process.env.DB_PORT);
        }

        connection = await mysql.createConnection(config);
        console.log('Connected to MySQL server for migration.');

        await connection.query('CREATE DATABASE IF NOT EXISTS du_publication_db');
        await connection.query('USE du_publication_db');

        console.log('Ensuring tables exist...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS colleges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_accounts_email (email)
            ) ENGINE=InnoDB
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL
            ) ENGINE=InnoDB
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS account_roles (
                account_id INT NOT NULL,
                role_id INT NOT NULL,
                PRIMARY KEY (account_id, role_id),
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                account_id INT UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                college_id INT NOT NULL,
                department VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
                FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
                INDEX idx_users_college (college_id)
            ) ENGINE=InnoDB
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS publications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                author_name VARCHAR(255) NOT NULL,
                gender ENUM('Male', 'Female') NOT NULL,
                author_phone VARCHAR(50),
                author_email VARCHAR(255),
                theme VARCHAR(255),
                title VARCHAR(500) NOT NULL,
                type VARCHAR(100) NOT NULL,
                date_published DATE NOT NULL,
                journal_name VARCHAR(255),
                doi VARCHAR(255),
                indexing VARCHAR(100),
                quartile ENUM('Q1', 'Q2', 'Q3', 'Q4'),
                funder ENUM('Dilla University', 'Other') NOT NULL,
                status ENUM('pending', 'approved', 'rejected') NOT NULL,
                remark TEXT,
                submitted_by INT NOT NULL,
                college_id INT NOT NULL,
                reviewed_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT,
                FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE RESTRICT,
                FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_pubs_submitted_by (submitted_by),
                INDEX idx_pubs_college_status (college_id, status),
                INDEX idx_pubs_status (status),
                INDEX idx_pubs_type (type),
                INDEX idx_pubs_date (date_published)
            ) ENGINE=InnoDB
        `);

        // Check if publications table has obsolete columns to drop
        const [pubCols] = await connection.query("SHOW COLUMNS FROM publications");
        const existingColNames = pubCols.map(c => c.Field);

        // Remove obsolete 'authors' column if it exists
        if (existingColNames.includes('authors')) {
            console.log("Removing obsolete column 'authors' from publications...");
            await connection.query("ALTER TABLE publications DROP COLUMN authors");
        }
        if (existingColNames.includes('journal_or_venue')) {
            console.log("Removing obsolete column 'journal_or_venue' from publications...");
            await connection.query("ALTER TABLE publications DROP COLUMN journal_or_venue");
        }
        if (existingColNames.includes('publication_date')) {
            console.log("Removing obsolete column 'publication_date' from publications...");
            await connection.query("ALTER TABLE publications DROP COLUMN publication_date");
        }
        if (existingColNames.includes('file_path')) {
            console.log("Removing obsolete column 'file_path' from publications...");
            await connection.query("ALTER TABLE publications DROP COLUMN file_path");
        }

        // Handle rename or migration from reviewer_comment to remark
        if (existingColNames.includes('reviewer_comment')) {
            if (!existingColNames.includes('remark')) {
                console.log("Renaming column 'reviewer_comment' to 'remark' in publications...");
                await connection.query("ALTER TABLE publications CHANGE COLUMN reviewer_comment remark TEXT");
            } else {
                console.log("Copying values from 'reviewer_comment' to 'remark' and dropping 'reviewer_comment'...");
                await connection.query("UPDATE publications SET remark = reviewer_comment WHERE remark IS NULL AND reviewer_comment IS NOT NULL");
                await connection.query("ALTER TABLE publications DROP COLUMN reviewer_comment");
            }
        } else if (!existingColNames.includes('remark')) {
            console.log("Adding missing column 'remark' to publications table...");
            await connection.query("ALTER TABLE publications ADD COLUMN remark TEXT");
        }

        const addColIfMissing = async (colName, colDef) => {
            if (!existingColNames.includes(colName)) {
                console.log(`Adding missing column ${colName} to publications table...`);
                await connection.query(`ALTER TABLE publications ADD COLUMN ${colDef}`);
            }
        };

        await addColIfMissing('author_name', "author_name VARCHAR(255) NOT NULL");
        await addColIfMissing('gender', "gender ENUM('Male', 'Female') NOT NULL");
        await addColIfMissing('author_phone', "author_phone VARCHAR(50)");
        await addColIfMissing('author_email', "author_email VARCHAR(255)");
        await addColIfMissing('theme', "theme VARCHAR(255)");
        await addColIfMissing('date_published', "date_published DATE NOT NULL");
        await addColIfMissing('journal_name', "journal_name VARCHAR(255)");
        await addColIfMissing('indexing', "indexing VARCHAR(100)");
        await addColIfMissing('quartile', "quartile ENUM('Q1', 'Q2', 'Q3', 'Q4')");
        await addColIfMissing('funder', "funder ENUM('Dilla University', 'Other') NOT NULL");

        // Insert standard roles and clean up legacy roles
        const standardRoles = ['researcher', 'vice_dean', 'publication_officer', 'supervisor'];
        for (const roleName of standardRoles) {
            await connection.query('INSERT IGNORE INTO roles (name) VALUES (?)', [roleName]);
        }

        // Clean up legacy roles (e.g. 'admin', 'member', etc.) not part of the active 4-role system
        console.log('Purging legacy roles and orphaned accounts from previous versions...');
        const [obsoleteRoles] = await connection.query(
            "SELECT id, name FROM roles WHERE name NOT IN ('researcher', 'vice_dean', 'publication_officer', 'supervisor')"
        );
        for (const obsRole of obsoleteRoles) {
            console.log(`Removing obsolete role '${obsRole.name}'...`);
            await connection.query('DELETE FROM account_roles WHERE role_id = ?', [obsRole.id]);
            await connection.query('DELETE FROM roles WHERE id = ?', [obsRole.id]);
        }

        // Purge legacy test/placeholder accounts that are not in the valid university domain or known system accounts
        const [legacyAccs] = await connection.query(
            "SELECT id, email FROM accounts WHERE email LIKE '%@example.com' OR email = 'admin@du.edu.et' OR email LIKE '%test%'"
        );
        for (const acc of legacyAccs) {
            console.log(`Removing legacy account: ${acc.email}...`);
            await connection.query('DELETE FROM accounts WHERE id = ?', [acc.id]);
        }

        console.log('Migration and cleanup completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exitCode = 1;
    } finally {
        if (connection) await connection.end();
    }
}

if (require.main === module) {
    migrate();
}

module.exports = migrate;
