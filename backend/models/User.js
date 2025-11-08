const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const ConnectedAccountSchema = new mongoose.Schema({
    connected: { type: Boolean, default: false },
    email: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    expiresAt: { type: Date },
    workspaceName: { type: String },
    workspaceId: { type: String },
    teamId: { type: String },
    botToken: { type: String },
    botUsername: { type: String }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    profilePicture: { type: String },
    connectedAccounts: {
        gmail: { type: ConnectedAccountSchema, default: {} },
        googleSheets: { type: ConnectedAccountSchema, default: {} },
        googleCalendar: { type: ConnectedAccountSchema, default: {} },
        slack: { type: ConnectedAccountSchema, default: {} },
        telegram: { type: ConnectedAccountSchema, default: {} }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

// Pre-save hooks
UserSchema.pre('save', async function (next) {
    try {
        if (this.isModified('password') && this.password) {
            const salt = await bcrypt.genSalt(SALT_ROUNDS);
            this.password = await bcrypt.hash(this.password, salt);
        }
        this.updatedAt = new Date();
        next();
    } catch (err) {
        next(err);
    }
});

// Methods
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
UserSchema.index({ createdAt: 1 });

module.exports = mongoose.model('User', UserSchema);
