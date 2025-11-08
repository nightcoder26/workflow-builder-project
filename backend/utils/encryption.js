const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

function getKey() {
    const key = process.env.ENCRYPTION_KEY || '';
    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 characters');
    }
    return Buffer.from(key);
}

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    // store iv and data together
    return iv.toString('base64') + ':' + encrypted;
}

function decrypt(payload) {
    if (!payload) return null;
    const [ivB64, encrypted] = payload.split(':');
    if (!ivB64 || !encrypted) return null;
    const iv = Buffer.from(ivB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };
