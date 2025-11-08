const axios = require('axios')
const { decrypt, encrypt } = require('./../utils/encryption')
const User = require('../models/User')

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

async function getValidGoogleToken(user, service) {
  // map service names
  const map = {
    gmail: 'gmail',
    sheets: 'googleSheets',
    calendar: 'googleCalendar'
  }
  const key = map[service] || service
  const acct = user.connectedAccounts[key]
  if (!acct || !acct.connected) throw new Error('Service not connected')

  const now = Date.now()
  const bufferMs = 5 * 60 * 1000 // 5 min buffer
  if (acct.expiresAt && new Date(acct.expiresAt).getTime() - bufferMs > now) {
    return decrypt(acct.accessToken)
  }

  // refresh
  const refreshToken = decrypt(acct.refreshToken)
  if (!refreshToken) throw new Error('No refresh token available')

  const params = new URLSearchParams()
  params.append('client_id', process.env.GOOGLE_API_CLIENT_ID)
  params.append('client_secret', process.env.GOOGLE_API_CLIENT_SECRET)
  params.append('refresh_token', refreshToken)
  params.append('grant_type', 'refresh_token')

  const resp = await axios.post(GOOGLE_TOKEN_URL, params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 })
  const data = resp.data
  if (!data || !data.access_token) throw new Error('Failed to refresh Google token')

  const encrypted = encrypt(String(data.access_token))
  acct.accessToken = encrypted
  acct.expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000)
  await user.save()
  return data.access_token
}

function getValidSlackToken(user) {
  const acct = user.connectedAccounts.slack
  if (!acct || !acct.connected) throw new Error('Slack not connected')
  return decrypt(acct.accessToken)
}

function getValidTelegramToken(user) {
  const acct = user.connectedAccounts.telegram
  if (!acct || !acct.connected) throw new Error('Telegram not connected')
  return decrypt(acct.botToken)
}

module.exports = { getValidGoogleToken, getValidSlackToken, getValidTelegramToken }
