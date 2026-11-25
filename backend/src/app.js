const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/authRoutes');
const researcherRoutes = require('./modules/researcher/researcherRoutes');
const viceDeanRoutes = require('./modules/vice_dean/viceDeanRoutes');
const officerRoutes = require('./modules/publication_officer/officerRoutes');
const supervisorRoutes = require('./modules/supervisor/supervisorRoutes');
const collegeRoutes = require('./modules/colleges/collegeRoutes');
const { errorHandler } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Mounted routes as per specifications
app.use('/api/auth', authRoutes);
app.use('/api/researcher', researcherRoutes);
app.use('/api/vice-dean', viceDeanRoutes);
app.use('/api/publication-officer', officerRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/colleges', collegeRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
