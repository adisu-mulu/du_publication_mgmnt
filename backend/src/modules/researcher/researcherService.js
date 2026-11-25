const pool = require('../../config/db');
const { listPublications } = require('../shared/publicationService');

async function createPublication(userId, collegeId, data) {
    const {
        author_name,
        gender,
        author_phone,
        author_email,
        theme,
        title,
        type,
        date_published,
        journal_name,
        doi,
        indexing,
        quartile,
        funder
    } = data;

    // Strict validation: every single field is required and must not be empty
    if (!author_name || !author_name.trim()) {
        const err = new Error('Name of the author is required.');
        err.status = 400;
        throw err;
    }
    if (!gender || !gender.trim()) {
        const err = new Error('Gender is required.');
        err.status = 400;
        throw err;
    }
    if (!author_phone || !author_phone.trim()) {
        const err = new Error("Author's phone number is required.");
        err.status = 400;
        throw err;
    }
    if (!author_email || !author_email.trim()) {
        const err = new Error("Author's email address is required.");
        err.status = 400;
        throw err;
    }
    if (!theme || !theme.trim()) {
        const err = new Error('Theme of the author is required.');
        err.status = 400;
        throw err;
    }
    if (!title || !title.trim()) {
        const err = new Error('Title of the article is required.');
        err.status = 400;
        throw err;
    }
    if (!type || !type.trim()) {
        const err = new Error('Type of article is required.');
        err.status = 400;
        throw err;
    }
    if (!date_published) {
        const err = new Error('Date of publication is required.');
        err.status = 400;
        throw err;
    }
    if (!journal_name || !journal_name.trim()) {
        const err = new Error('Name of the published journal is required.');
        err.status = 400;
        throw err;
    }
    if (!doi || !doi.trim()) {
        const err = new Error('DOI is required.');
        err.status = 400;
        throw err;
    }
    if (!indexing || !indexing.trim()) {
        const err = new Error('Journal indexing is required.');
        err.status = 400;
        throw err;
    }
    if (!quartile || !quartile.trim()) {
        const err = new Error('Quartile ranking is required.');
        err.status = 400;
        throw err;
    }
    if (!funder || !funder.trim()) {
        const err = new Error('Funder is required.');
        err.status = 400;
        throw err;
    }

    const [result] = await pool.execute(
        `INSERT INTO publications 
        (author_name, gender, author_phone, author_email, title, theme, type, date_published, journal_name, doi, indexing, quartile, funder, status, submitted_by, college_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
            author_name.trim(),
            gender.trim(),
            author_phone.trim(),
            author_email.trim(),
            title.trim(),
            theme.trim(),
            type.trim(),
            date_published,
            journal_name.trim(),
            doi.trim(),
            indexing.trim(),
            quartile.trim(),
            funder.trim(),
            userId,
            collegeId
        ]
    );

    return { id: result.insertId, message: 'Publication submitted successfully and is now pending review.' };
}

async function getMyPublications(userId, query) {
    return listPublications({
        ...query,
        submittedBy: userId,
        visibleOnlyApproved: false
    });
}

async function getMyPublicationById(userId, pubId) {
    const [rows] = await pool.execute(
        `SELECT p.*, c.name as college_name, r.full_name as reviewer_name
         FROM publications p
         JOIN colleges c ON p.college_id = c.id
         LEFT JOIN users r ON p.reviewed_by = r.id
         WHERE p.id = ? AND p.submitted_by = ?`,
        [pubId, userId]
    );

    if (rows.length === 0) {
        const err = new Error('Publication not found.');
        err.status = 404;
        throw err;
    }

    return rows[0];
}

async function updatePublication(userId, pubId, data) {
    const pub = await getMyPublicationById(userId, pubId);

    if (pub.status === 'approved') {
        const err = new Error('Approved publications cannot be edited directly.');
        err.status = 400;
        throw err;
    }

    const {
        author_name,
        gender,
        author_phone,
        author_email,
        title,
        theme,
        type,
        date_published,
        journal_name,
        doi,
        indexing,
        quartile,
        funder
    } = data;

    await pool.execute(
        `UPDATE publications 
         SET author_name = ?, gender = ?, author_phone = ?, author_email = ?,
             title = ?, theme = ?, type = ?, date_published = ?,
             journal_name = ?, doi = ?, indexing = ?, quartile = ?, funder = ?,
             status = 'pending'
         WHERE id = ? AND submitted_by = ?`,
        [
            author_name !== undefined ? author_name.trim() : pub.author_name,
            gender !== undefined ? gender : pub.gender,
            author_phone !== undefined ? author_phone.trim() : pub.author_phone,
            author_email !== undefined ? author_email.trim() : pub.author_email,
            title !== undefined ? title.trim() : pub.title,
            theme !== undefined ? theme : pub.theme,
            type !== undefined ? type : pub.type,
            date_published !== undefined ? date_published : pub.date_published,
            journal_name !== undefined ? journal_name.trim() : pub.journal_name,
            doi !== undefined ? doi.trim() : pub.doi,
            indexing !== undefined ? indexing : pub.indexing,
            quartile !== undefined ? quartile : pub.quartile,
            funder !== undefined ? funder : pub.funder,
            pubId,
            userId
        ]
    );

    return { message: 'Publication updated and resubmitted for verification.' };
}

async function deletePublication(userId, pubId) {
    const pub = await getMyPublicationById(userId, pubId);
    if (pub.status === 'approved') {
        const err = new Error('Cannot delete an approved publication record.');
        err.status = 400;
        throw err;
    }

    await pool.execute('DELETE FROM publications WHERE id = ? AND submitted_by = ?', [pubId, userId]);
    return { message: 'Publication deleted successfully.' };
}

module.exports = {
    createPublication,
    getMyPublications,
    getMyPublicationById,
    updatePublication,
    deletePublication
};
