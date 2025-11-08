const express = require('express')
const axios = require('axios')
const router = express.Router()
const User = require('../models/User')
const jwt = require('jsonwebtoken')

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000'

// Helper: verify JWT token if passed (optional)
function setSessionUserFromToken(req) {
    const token = req.query.token || req.body?.token
    if (!token) return null
    try {
        const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change_this_secret'
        const decoded = jwt.verify(String(token), secret)
        if (decoded?.id) {
            req.session.userId = decoded.id
            return decoded.id
        }
    } catch {
        // ignore
    }
    return null
}

// ---------- GOOGLE LOGIN (OAUTH) ----------
router.get('/google/auth', async (req, res) => {
    try {
        const baseRedirect =
            process.env.GOOGLE_API_REDIRECT_URI ||
            `${req.protocol}://${req.get('host')}/api/connections/google/callback`

        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_API_CLIENT_ID || '',
            redirect_uri: baseRedirect,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent'
        })

        const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
        return res.redirect(url)
    } catch (err) {
        console.error('google login start', err)
        return res.redirect(`${FRONTEND}/login?error=connection_failed`)
    }
})

router.get('/google/callback', async (req, res) => {
    try {
        const code = req.query.code
        if (!code) return res.redirect(`${FRONTEND}/login?error=missing_code`)

        // Exchange code for tokens
        const tokenResp = await axios.post(
            'https://oauth2.googleapis.com/token',
            new URLSearchParams({
                code: String(code),
                client_id: process.env.GOOGLE_API_CLIENT_ID,
                client_secret: process.env.GOOGLE_API_CLIENT_SECRET,
                redirect_uri:
                    process.env.GOOGLE_API_REDIRECT_URI ||
                    `${req.protocol}://${req.get('host')}/api/connections/google/callback`,
                grant_type: 'authorization_code'
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )

        const { access_token, id_token } = tokenResp.data
        if (!access_token && !id_token)
            return res.redirect(`${FRONTEND}/login?error=token_failed`)

        // Fetch user info
        const profileResp = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        })
        const profile = profileResp.data

        // Find or create user in DB
        let user = await User.findOne({ email: profile.email })
        if (!user) {
            user = await User.create({
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
                authProvider: 'google'
            })
        }

        // Create JWT
        const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change_this_secret'
        const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' })

        // Redirect to frontend with token
        return res.redirect(`${FRONTEND}/auth/callback?token=${token}`)
    } catch (err) {
        console.error('google callback', err?.response?.data || err.message)
        return res.redirect(`${FRONTEND}/login?error=connection_failed`)
    }
})

module.exports = router
