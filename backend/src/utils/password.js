const crypto = require('crypto');

/**
 * Standard scrypt password hashing using Node.js built-in crypto module.
 * Format: scrypt$<salt_hex>$<derived_key_hex>
 */
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash) return false;
    // Support transition from legacy plain text if any exists
    if (!storedHash.startsWith('scrypt$')) {
        return password === storedHash;
    }
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const key = parts[2];
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
}

module.exports = {
    hashPassword,
    verifyPassword
};
