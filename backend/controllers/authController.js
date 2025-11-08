const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate a signed JWT for a user
function signToken(user) {
    const payload = { id: user._id };
    const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change_this_secret';
    return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// ===================== REGISTER =====================
exports.register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, error: 'Email, password and name are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email already in use' });
        }

        // Create new user
        const user = new User({ email: email.toLowerCase(), password, name });
        await user.save();

        const token = signToken(user);
        const safeUser = {
            id: user._id,
            email: user.email,
            name: user.name,
            authProvider: user.authProvider,
        };

        return res.status(201).json({ success: true, user: safeUser, token });
    } catch (err) {
        console.error('Register error:', err);
        next(err);
    }
};

// ===================== LOGIN =====================
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log('[LOGIN ATTEMPT]', { email, password }); // 👈 Log incoming credentials

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        // Explicitly select password
        const user = await User.findOne({ email: email.toLowerCase(), authProvider: 'local' }).select('+password');
        console.log('[USER FOUND?]', !!user, user?.email);

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials (no user found)' });
        }

        console.log('[HASH IN DB]', user.password);
        console.log('[PASSWORD ENTERED]', password);

        const isMatch = await user.comparePassword(password);
        console.log('[PASSWORD MATCH RESULT]', isMatch);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials (wrong password)' });
        }

        const token = signToken(user);
        const safeUser = { id: user._id, email: user.email, name: user.name, authProvider: user.authProvider };

        console.log('[LOGIN SUCCESS]', safeUser);

        return res.json({ success: true, user: safeUser, token });
    } catch (err) {
        console.error('Login error:', err);
        next(err);
    }
};

// ===================== VERIFY TOKEN (Middleware helper) =====================
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change_this_secret');
        req.user = decoded;
    } catch (err) {
        req.user = null;
    }
    next();
}

exports.verifyToken = verifyToken;

// ===================== /api/auth/me =====================
exports.me = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        return res.json({ success: true, user });
    } catch (err) {
        console.error('Me error:', err);
        next(err);
    }
};

// ===================== /api/auth/status =====================
exports.status = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.json({ authenticated: false, user: null });
        }

        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.json({ authenticated: false, user: null });
        }

        return res.json({ authenticated: true, user });
    } catch (err) {
        console.error('Status error:', err);
        next(err);
    }
};

// ===================== LOGOUT =====================
exports.logout = async (req, res) => {
    // Stateless JWT logout → client removes token
    return res.json({ success: true, message: 'Logged out (client-side token removal recommended)' });
};

// ===================== UPDATE PROFILE =====================
exports.updateProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.name = name;
        await user.save();

        const safeUser = { id: user._id, email: user.email, name: user.name };
        return res.json({ success: true, user: safeUser });
    } catch (err) {
        console.error('UpdateProfile error:', err);
        next(err);
    }
};

// ===================== CHANGE PASSWORD =====================
exports.changePassword = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'currentPassword and newPassword required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(403).json({ success: false, error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        return res.json({ success: true, message: 'Password changed' });
    } catch (err) {
        console.error('ChangePassword error:', err);
        next(err);
    }
};
