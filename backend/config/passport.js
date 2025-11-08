const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails && profile.emails[0] && profile.emails[0].value;
                let user = await User.findOne({ googleId: profile.id });
                if (!user && email) {
                    user = await User.findOne({ email });
                }

                if (user) {
                    // update googleId if missing
                    if (!user.googleId) {
                        user.googleId = profile.id;
                    }
                    user.lastLogin = new Date();
                    user.profilePicture = user.profilePicture || (profile.photos && profile.photos[0] && profile.photos[0].value);
                    await user.save();
                    return done(null, user);
                }

                // create new user
                const newUser = new User({
                    email: email,
                    name: profile.displayName || email,
                    googleId: profile.id,
                    authProvider: 'google',
                    profilePicture: profile.photos && profile.photos[0] && profile.photos[0].value,
                    lastLogin: new Date()
                });
                await newUser.save();
                return done(null, newUser);
            } catch (err) {
                return done(err);
            }
        }));
    }
};
