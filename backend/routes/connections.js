const express = require('express')
const axios = require('axios')
const router = express.Router()
const User = require('../models/User')
const { encrypt, decrypt } = require('../utils/encryption')
const { requireAuth } = require('../middleware/auth')

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000'

// Helper: decode JWT token passed in query to set session user
const jwt = require('jsonwebtoken')
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
    } catch (err) {
        // ignore
    }
    return null
}

// ---------- GOOGLE OAUTH START ----------
router.get('/google/auth', async (req, res) => {
    try {
        const service = req.query.service
        if (!service) return res.status(400).send('service required')
        // support token in query to associate session
        setSessionUserFromToken(req)
        req.session.googleService = service

        const scopesMap = {
            gmail: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.labels'],
            sheets: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly'],
            calendar: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
        }
        const scopes = scopesMap[service]
        if (!scopes) return res.status(400).send('invalid service')

        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_API_CLIENT_ID || '',
            redirect_uri: process.env.GOOGLE_API_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/connections/google/callback`,
            response_type: 'code',
            scope: scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent'
        })
        const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
        return res.redirect(url)
    } catch (err) {
        console.error('google auth start', err)
        return res.redirect(`${FRONTEND}/dashboard?error=connection_failed`)
    }
})

router.get('/google/callback', async (req, res) => {
    try {
        const code = req.query.code
        const service = req.session.googleService
        const userId = req.session.userId
        if (!service) return res.redirect(`${FRONTEND}/dashboard?error=missing_service`)
        if (!userId) return res.redirect(`${FRONTEND}/dashboard?error=not_authenticated`)

        // exchange code
        const tokenResp = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
            code: String(code),
            client_id: process.env.GOOGLE_API_CLIENT_ID,
            client_secret: process.env.GOOGLE_API_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_API_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/connections/google/callback`,
            grant_type: 'authorization_code'
        }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 })

        const t = tokenResp.data
        const accessToken = t.access_token
        const refreshToken = t.refresh_token
        const expiresIn = t.expires_in

        // fetch profile email
        const profile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 30000 })
        const email = profile.data?.email

        const user = await User.findById(userId)
        if (!user) return res.redirect(`${FRONTEND}/dashboard?error=not_found`)

        const acctKey = service === 'sheets' ? 'googleSheets' : service === 'calendar' ? 'googleCalendar' : 'gmail'
        user.connectedAccounts[acctKey] = {
            connected: true,
            email: email || undefined,
            accessToken: encrypt(String(accessToken)),
            refreshToken: encrypt(String(refreshToken || '')),
            expiresAt: new Date(Date.now() + (expiresIn || 3600) * 1000)
        }
        await user.save()

        // clear session markers
        delete req.session.googleService
        return res.redirect(`${FRONTEND}/dashboard?connected=${service}`)
    } catch (err) {
        console.error('google callback', err?.response?.data || err.message)
        return res.redirect(`${FRONTEND}/dashboard?error=connection_failed`)
    }
})

router.delete('/google/:service', requireAuth, async (req, res) => {
    try {
        const service = req.params.service
        const valid = { gmail: 'gmail', sheets: 'googleSheets', calendar: 'googleCalendar' }
        if (!valid[service]) return res.status(400).json({ success: false, error: 'Invalid service' })
        const acctKey = valid[service]
        const user = await User.findById(req.user._id)
        user.connectedAccounts[acctKey] = { connected: false }
        await user.save()
        return res.json({ success: true, message: 'Disconnected' })
    } catch (err) {
        console.error('delete google', err)
        return res.status(500).json({ success: false, error: 'Server error' })
    }
})

// ---------- SLACK ----------
router.get('/slack/auth', (req, res) => {
    try {
        setSessionUserFromToken(req)
        const params = new URLSearchParams({
            client_id: process.env.SLACK_CLIENT_ID || '',
            scope: 'channels:read,channels:history,chat:write,users:read',
            redirect_uri: process.env.SLACK_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/connections/slack/callback`
        })
        return res.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`)
    } catch (err) {
        console.error('slack auth', err)
        return res.redirect(`${FRONTEND}/dashboard?error=connection_failed`)
    }
})

router.get('/slack/callback', async (req, res) => {
    try {
        const code = req.query.code
        const userId = req.session.userId
        if (!userId) return res.redirect(`${FRONTEND}/dashboard?error=not_authenticated`)
        const params = new URLSearchParams({ code: String(code), client_id: process.env.SLACK_CLIENT_ID, client_secret: process.env.SLACK_CLIENT_SECRET, redirect_uri: process.env.SLACK_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/connections/slack/callback` })
        const resp = await axios.post(`https://slack.com/api/oauth.v2.access?${params.toString()}`, null, { timeout: 30000 })
        const data = resp.data
        if (!data || !data.ok) throw new Error(JSON.stringify(data))
        const accessToken = data.access_token
        const team = data.team || {}
        const authed = data.authed_user || {}

        const user = await User.findById(userId)
        user.connectedAccounts.slack = {
            connected: true,
            workspaceName: team.name,
            workspaceId: team.id,
            accessToken: encrypt(String(accessToken)),
            botUserId: data.bot_user_id || undefined,
            teamId: team.id || undefined
        }
        await user.save()
        return res.redirect(`${FRONTEND}/dashboard?connected=slack`)
    } catch (err) {
        console.error('slack callback', err?.response?.data || err.message)
        return res.redirect(`${FRONTEND}/dashboard?error=connection_failed`)
    }
})

router.delete('/slack', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        user.connectedAccounts.slack = { connected: false }
        await user.save()
        return res.json({ success: true, message: 'Slack disconnected' })
    } catch (err) {
        console.error('delete slack', err)
        return res.status(500).json({ success: false, error: 'Server error' })
    }
})

// ---------- TELEGRAM ----------
router.post('/telegram', requireAuth, async (req, res) => {
    try {
        const botToken = String(req.body.botToken || '')
        if (!/^[0-9]+:\w+/.test(botToken)) return res.status(400).json({ success: false, error: 'Invalid bot token' })
        const resp = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, { timeout: 30000 })
        const data = resp.data
        if (!data || !data.ok) return res.status(400).json({ success: false, error: 'Invalid bot token' })
        const result = data.result
        const user = await User.findById(req.user._id)
        user.connectedAccounts.telegram = { connected: true, botToken: encrypt(botToken), botUsername: result.username }
        await user.save()
        return res.json({ success: true, botUsername: result.username })
    } catch (err) {
        console.error('telegram connect', err?.response?.data || err.message)
        return res.status(400).json({ success: false, error: 'Invalid bot token' })
    }
})

router.delete('/telegram', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        user.connectedAccounts.telegram = { connected: false }
        await user.save()
        return res.json({ success: true, message: 'Telegram disconnected' })
    } catch (err) {
        console.error('delete telegram', err)
        return res.status(500).json({ success: false, error: 'Server error' })
    }
})

// ---------- CONNECTION STATUS ----------
router.get('/status', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).lean()
        if (!user) return res.status(404).json({ success: false, error: 'User not found' })
        const ca = user.connectedAccounts || {}
        const out = {
            gmail: { connected: !!ca.gmail?.connected, email: ca.gmail?.email || undefined },
            googleSheets: { connected: !!ca.googleSheets?.connected, email: ca.googleSheets?.email || undefined },
            googleCalendar: { connected: !!ca.googleCalendar?.connected, email: ca.googleCalendar?.email || undefined },
            slack: { connected: !!ca.slack?.connected, workspaceName: ca.slack?.workspaceName || undefined },
            telegram: { connected: !!ca.telegram?.connected, botUsername: ca.telegram?.botUsername || undefined }
        }
        return res.json({ success: true, data: out })
    } catch (err) {
        console.error('connections status', err)
        return res.status(500).json({ success: false, error: 'Server error' })
    }
})

module.exports = router
