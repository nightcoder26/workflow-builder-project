const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Require authentication — rejects request if JWT is missing or invalid.
 */
async function requireAuth(req, res, next) {
    try {
        const auth = req.headers.authorization || '';
        if (!auth.startsWith('Bearer ')) {
            return res.status(401).json({ authenticated: false, user: null });
        }

        const token = auth.split(' ')[1];
        const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change_this_secret';

        const decoded = jwt.verify(token, secret);
        if (!decoded?.id) {
            return res.status(401).json({ authenticated: false, user: null });
        }

        const user = await User.findById(decoded.id).select('-password').lean();
        if (!user) {
            return res.status(401).json({ authenticated: false, user: null });
        }

        // include both `id` and `_id` for compatibility with controllers
        req.user = { id: user._id, _id: user._id, email: user.email, name: user.name };
        next();
    } catch (err) {
        console.error('[requireAuth error]', err.message);
        return res.status(401).json({ authenticated: false, user: null });
    }
}

/**
 * Optional authentication — attaches req.user if JWT valid, otherwise continues.
 */
async function optionalAuth(req, res, next) {
    try {
        const auth = req.headers.authorization || '';
        if (!auth.startsWith('Bearer ')) return next();

        const token = auth.split(' ')[1];
        const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change_this_secret';
        const decoded = jwt.verify(token, secret);

        if (decoded?.id) {
            const user = await User.findById(decoded.id).select('-password').lean();
            if (user) req.user = { id: user._id, _id: user._id, email: user.email, name: user.name };
        }
    } catch (err) {
        console.warn('[optionalAuth warning]', err.message);
    } finally {
        next();
    }
}

module.exports = { requireAuth, optionalAuth };
