const express = require('express')
const axios = require('axios')
const router = express.Router()
const { requireAuth } = require('../middleware/auth')
const User = require('../models/User')
const { getValidGoogleToken, getValidSlackToken } = require('../utils/tokenRefresh')

// LIST SPREADSHEETS
router.get('/sheets/spreadsheets', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const token = await getValidGoogleToken(user, 'sheets')
    const resp = await axios.get('https://www.googleapis.com/drive/v3/files', { params: { q: "mimeType='application/vnd.google-apps.spreadsheet'", fields: 'files(id,name)', pageSize: 100 }, headers: { Authorization: `Bearer ${token}` }, timeout: 30000 })
    const files = resp.data.files || []
    return res.json({ success: true, data: files })
  } catch (err) {
    console.error('sheets spreadsheets', err?.response?.data || err.message)
    return res.status(500).json({ success: false, error: 'Failed to fetch spreadsheets' })
  }
})

// LIST WORKSHEETS (SHEET TABS)
router.get('/sheets/worksheets/:spreadsheetId', requireAuth, async (req, res) => {
  try {
    const { spreadsheetId } = req.params
    const user = await User.findById(req.user._id)
    const token = await getValidGoogleToken(user, 'sheets')
    const resp = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`, { params: { fields: 'sheets.properties(sheetId,title)' }, headers: { Authorization: `Bearer ${token}` }, timeout: 30000 })
    const sheets = (resp.data.sheets || []).map(s => ({ id: s.properties.sheetId, name: s.properties.title }))
    return res.json({ success: true, data: sheets })
  } catch (err) {
    console.error('sheets worksheets', err?.response?.data || err.message)
    return res.status(500).json({ success: false, error: 'Failed to fetch worksheets' })
  }
})

// GET HEADERS (first row)
router.get('/sheets/headers/:spreadsheetId/:sheetName', requireAuth, async (req, res) => {
  try {
    const { spreadsheetId, sheetName } = req.params
    const user = await User.findById(req.user._id)
    const token = await getValidGoogleToken(user, 'sheets')
    const resp = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(sheetName)}!1:1`, { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 })
    const values = (resp.data.values && resp.data.values[0]) || []
    return res.json({ success: true, data: values })
  } catch (err) {
    console.error('sheets headers', err?.response?.data || err.message)
    return res.status(500).json({ success: false, error: 'Failed to fetch headers' })
  }
})

// CALENDARS
router.get('/calendar/calendars', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const token = await getValidGoogleToken(user, 'calendar')
    const resp = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', { params: { fields: 'items(id,summary,primary,backgroundColor)' }, headers: { Authorization: `Bearer ${token}` }, timeout: 30000 })
    const items = resp.data.items || []
    const out = items.map(i => ({ id: i.id, name: i.summary, isPrimary: !!i.primary, color: i.backgroundColor }))
    return res.json({ success: true, data: out })
  } catch (err) {
    console.error('calendar list', err?.response?.data || err.message)
    return res.status(500).json({ success: false, error: 'Failed to fetch calendars' })
  }
})

// GMAIL LABELS
router.get('/gmail/labels', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const token = await getValidGoogleToken(user, 'gmail')
    const resp = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/labels', { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 })
    const labels = resp.data.labels || []
    const filtered = labels.filter(l => !['CHAT','SPAM','TRASH','SENT'].includes((l.name||'').toUpperCase()))
    return res.json({ success: true, data: filtered })
  } catch (err) {
    console.error('gmail labels', err?.response?.data || err.message)
    return res.status(500).json({ success: false, error: 'Failed to fetch labels' })
  }
})

// SLACK channels
router.get('/slack/channels', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const token = getValidSlackToken(user)
    const resp = await axios.get('https://slack.com/api/conversations.list', { params: { types: 'public_channel,private_channel', exclude_archived: true, limit: 1000 }, headers: { Authorization: `Bearer ${token}` }, timeout: 30000 })
    const channels = (resp.data.channels || []).map(c => ({ id: c.id, name: c.name }))
    return res.json({ success: true, data: channels })
  } catch (err) {
    console.error('slack channels', err?.response?.data || err.message)
    return res.status(500).json({ success: false, error: 'Failed to fetch channels' })
  }
})

// SLACK users
router.get('/slack/users', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const token = getValidSlackToken(user)
    const resp = await axios.get('https://slack.com/api/users.list', { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 })
    const members = (resp.data.members || []).filter(m => !m.deleted && !(m.is_bot)).map(m => ({ id: m.id, name: m.name, realName: m.real_name }))
    return res.json({ success: true, data: members })
  } catch (err) {
    console.error('slack users', err?.response?.data || err.message)
    return res.status(500).json({ success: false, error: 'Failed to fetch users' })
  }
})

module.exports = router
