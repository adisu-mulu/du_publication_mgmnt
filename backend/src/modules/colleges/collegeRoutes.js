const express = require('express');
const pool = require('../../config/db');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const [rows] = await pool.execute('SELECT id, name FROM colleges ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

router.get('/filters', async (req, res, next) => {
    try {
        const [years] = await pool.execute(`
            SELECT DISTINCT YEAR(date_published) as year
            FROM publications
            WHERE status = 'approved' AND date_published IS NOT NULL
            ORDER BY year DESC
        `);
        const [types] = await pool.execute(`
            SELECT DISTINCT type FROM publications WHERE status = 'approved' AND type IS NOT NULL AND TRIM(type) != '' ORDER BY type ASC
        `);
        const [indexings] = await pool.execute(`
            SELECT DISTINCT indexing FROM publications WHERE status = 'approved' AND indexing IS NOT NULL AND TRIM(indexing) != '' ORDER BY indexing ASC
        `);
        const [themes] = await pool.execute(`
            SELECT DISTINCT theme FROM publications WHERE status = 'approved' AND theme IS NOT NULL AND TRIM(theme) != '' ORDER BY theme ASC
        `);
        const [colleges] = await pool.execute('SELECT id, name FROM colleges ORDER BY name ASC');

        res.json({
            years: years.map(y => y.year),
            types: types.map(t => t.type),
            indexings: indexings.map(i => i.indexing),
            themes: themes.map(th => th.theme),
            colleges
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
