require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');
const path = require('path');

const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB();

// Passport config
require('./config/passport')(passport);

// Middleware
app.use(helmet());

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const session = require('express-session')
const MongoStore = require('connect-mongo')

app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Sessions (used to keep popup state during OAuth flows)
const sessionSecret = process.env.SESSION_SECRET || 'change_this_secret'
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: 'lax' },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    })

}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport (used for OAuth flow only)
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workflows', require('./routes/workflows'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/data', require('./routes/data'));

// 404
app.use((req, res, next) => {
    res.status(404).json({ success: false, error: 'Not Found' });
});

// Error handler
app.use(require('./middleware/errorHandler'));

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down');
    server.close(() => process.exit(0));
});
