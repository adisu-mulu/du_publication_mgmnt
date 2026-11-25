const pool = require('./src/config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { hashPassword } = require('./src/utils/password');

async function seed() {
    let connection;
    try {
        const config = {
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'du_publication_db'
        };
        if (process.env.DB_SOCKET) config.socketPath = process.env.DB_SOCKET;
        else {
            config.host = process.env.DB_HOST || '127.0.0.1';
            if (process.env.DB_PORT) config.port = Number(process.env.DB_PORT);
        }

        connection = await pool; // use configured connection pool
        console.log('Connected to database for seeding.');

        // 1. Seed Colleges
        const colleges = [
            'College of Natural and Computational Sciences',
            'College of Engineering and Technology',
            'College of Medicine and Health Sciences',
            'College of Business and Economics',
            'College of Agriculture and Natural Resources',
            'College of Social Sciences and Humanities'
        ];

        for (const collegeName of colleges) {
            await connection.query('INSERT IGNORE INTO colleges (name) VALUES (?)', [collegeName]);
        }
        console.log('Colleges seeded.');

        // Fetch colleges map
        const [colRows] = await connection.query('SELECT id, name FROM colleges');
        const collegeMap = {};
        colRows.forEach(c => { collegeMap[c.name] = c.id; });
        const defaultCollegeId = colRows[0].id;
        const secondCollegeId = colRows.length > 1 ? colRows[1].id : defaultCollegeId;

        // 2. Fetch Roles
        const [roleRows] = await connection.query('SELECT id, name FROM roles');
        const roleMap = {};
        roleRows.forEach(r => { roleMap[r.name] = r.id; });

        async function createTestAccount({ email, password, fullName, phone, collegeId, department, roleNames }) {
            const [accRows] = await connection.query('SELECT id FROM accounts WHERE email = ?', [email]);
            let accountId;
            const passwordHash = hashPassword(password);

            if (accRows.length === 0) {
                const [accRes] = await connection.query(
                    'INSERT INTO accounts (email, password_hash, is_active) VALUES (?, ?, 1)',
                    [email, passwordHash]
                );
                accountId = accRes.insertId;
            } else {
                accountId = accRows[0].id;
                await connection.query(
                    'UPDATE accounts SET password_hash = ?, is_active = 1 WHERE id = ?',
                    [passwordHash, accountId]
                );
            }

            const [uRows] = await connection.query('SELECT id FROM users WHERE account_id = ?', [accountId]);
            let userId;
            if (uRows.length === 0) {
                const [uRes] = await connection.query(
                    'INSERT INTO users (account_id, full_name, phone, college_id, department) VALUES (?, ?, ?, ?, ?)',
                    [accountId, fullName, phone, collegeId, department]
                );
                userId = uRes.insertId;
            } else {
                userId = uRows[0].id;
                await connection.query(
                    'UPDATE users SET full_name = ?, phone = ?, college_id = ?, department = ? WHERE id = ?',
                    [fullName, phone, collegeId, department, userId]
                );
            }

            const allRolesToAssign = Array.from(new Set(['researcher', ...roleNames]));
            for (const rName of allRolesToAssign) {
                const rId = roleMap[rName];
                if (rId) {
                    await connection.query(
                        'INSERT IGNORE INTO account_roles (account_id, role_id) VALUES (?, ?)',
                        [accountId, rId]
                    );
                }
            }

            return { accountId, userId };
        }

        // 3. Seed Required Test Accounts
        const defaultPassword = 'Password123!';

        // Account 1: Researcher only
        const resAcc = await createTestAccount({
            email: 'researcher@du.edu.et',
            password: defaultPassword,
            fullName: 'Dr. Abebe Bekele',
            phone: '+251911000001',
            collegeId: defaultCollegeId,
            department: 'Computer Science',
            roleNames: ['researcher']
        });

        // Account 2: Researcher + Vice Dean
        const vdAcc = await createTestAccount({
            email: 'vicedean@du.edu.et',
            password: defaultPassword,
            fullName: 'Dr. Chala Tadesse',
            phone: '+251911000002',
            collegeId: defaultCollegeId,
            department: 'Physics',
            roleNames: ['vice_dean']
        });

        // Account 3: Researcher + Publication Officer
        const poAcc = await createTestAccount({
            email: 'officer@du.edu.et',
            password: defaultPassword,
            fullName: 'Prof. Almaz Hailu',
            phone: '+251911000003',
            collegeId: secondCollegeId,
            department: 'Public Health',
            roleNames: ['publication_officer']
        });

        // Account 4: Researcher + Supervisor
        const supAcc = await createTestAccount({
            email: 'supervisor@du.edu.et',
            password: defaultPassword,
            fullName: 'Dr. Dawit Mengistu',
            phone: '+251911000004',
            collegeId: defaultCollegeId,
            department: 'Economics',
            roleNames: ['supervisor']
        });

        // Account 5: All roles (Switcher test)
        const multiAcc = await createTestAccount({
            email: 'multi@du.edu.et',
            password: defaultPassword,
            fullName: 'Dr. Rahel Kebede (All Roles)',
            phone: '+251911000005',
            collegeId: defaultCollegeId,
            department: 'Natural Resource Management',
            roleNames: ['researcher', 'vice_dean', 'publication_officer', 'supervisor']
        });

        console.log('Test accounts seeded successfully.');

        // 4. Seed sample publication records with all original fields
        const [existingPubs] = await connection.query('SELECT id FROM publications LIMIT 1');
        if (existingPubs.length === 0) {
            await connection.query(`
                INSERT INTO publications 
                (author_name, gender, author_phone, author_email, theme, title, type, date_published, journal_name, doi, indexing, quartile, funder, status, remark, submitted_by, college_id, reviewed_by)
                VALUES 
                (
                    'Dr. Abebe Bekele',
                    'Male',
                    '+251911000001',
                    'researcher@du.edu.et',
                    'Theme 1',
                    'Deep Learning for Coffee Leaf Disease Identification in Southern Ethiopia',
                    'Full Length Article',
                    '2026-03-15',
                    'Computers and Electronics in Agriculture',
                    '10.1016/j.compag.2026.107000',
                    'Scopus',
                    'Q1',
                    'Dilla University',
                    'approved',
                    'Verified authentic journal article with indexed DOI.',
                    ?, ?, ?
                ),
                (
                    'Prof. Almaz Hailu',
                    'Female',
                    '+251911000003',
                    'officer@du.edu.et',
                    'Theme 3',
                    'Epidemiological Analysis of Waterborne Diseases in Gedeo Zone',
                    'Review Article',
                    '2026-06-10',
                    'Ethiopian Journal of Health Sciences',
                    '10.4314/ejhs.v34i3.4',
                    'PubMed',
                    'Q2',
                    'Other',
                    'pending',
                    NULL,
                    ?, ?, NULL
                )
            `, [
                resAcc.userId, defaultCollegeId, poAcc.userId,
                poAcc.userId, secondCollegeId
            ]);
            console.log('Sample publications seeded.');
        }

        console.log('All seeds completed successfully.');
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    seed();
}

module.exports = seed;
