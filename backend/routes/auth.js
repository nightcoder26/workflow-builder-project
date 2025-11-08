const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// ================= PUBLIC ROUTES =================

// Register a new user
router.post('/register', authController.register);

// Login with email & password
router.post('/login', authController.login);

// Logout (JWT-based, so just tells client to clear token)
router.post('/logout', authController.logout);

// ================= GOOGLE OAUTH =================

// Redirect to Google for authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Handle Google OAuth callback
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);

        // ✅ Issue JWT and redirect back to frontend
        const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change_this_secret';
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
        const redirectUrl = `${process.env.FRONTEND_URL}/login?token=${encodeURIComponent(token)}`;
        return res.redirect(redirectUrl);
    })(req, res, next);
});

// ================= PROTECTED ROUTES =================

// Get current authenticated user (requires JWT)
router.get('/me', requireAuth, authController.me);

// Update profile (requires JWT)
router.put('/profile', requireAuth, authController.updateProfile);

// Change password (requires JWT)
router.put('/password', requireAuth, authController.changePassword);

// ================= SEMI-PROTECTED ROUTE =================

// Auth status (optional — won’t throw if token missing)
router.get('/status', optionalAuth, authController.status);

module.exports = router;
