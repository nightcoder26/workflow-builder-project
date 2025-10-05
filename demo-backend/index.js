const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
require('dotenv').config();


const app = express()
app.use(cors())
app.use(bodyParser.json());

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
    PORT = 4000,
} = process.env

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    console.warn('Missing Google OAuth credentials in environment. Endpoints will fail without them.')
}

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
)

oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
})

async function getAuth() {
    const token = await oauth2Client.getAccessToken().catch((err) => {
        console.error('Failed to obtain access token', err)
        throw err
    })
    return oauth2Client
}

function decodeBase64Url(str = '') {
    const buff = Buffer.from(str, 'base64')
    return buff.toString('utf-8')
}

app.get('/api/emails/updates', async (req, res) => {
    try {
        const sinceMs = Number(req.query.sinceMs || 0)
        const auth = await getAuth()
        const gmail = google.gmail({ version: 'v1', auth })

        const listRes = await gmail.users.messages.list({
            userId: 'me',
            labelIds: ['INBOX'],
            maxResults: 50,
        })

        const messages = listRes.data.messages || []
        const detailed = []

        for (const m of messages) {
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: m.id,
                format: 'full',
            })

            const payload = msg.data.payload || {}
            const headers = (payload.headers || []).reduce((acc, h) => {
                acc[h.name.toLowerCase()] = h.value
                return acc
            }, {})

            const internalDate = Number(msg.data.internalDate || 0)
            if (internalDate <= sinceMs) continue

            const attachmentNames = []
            function collectParts(parts = []) {
                parts.forEach((p) => {
                    if (p.filename && p.filename.length) {
                        attachmentNames.push(p.filename)
                    }
                    if (p.parts) collectParts(p.parts)
                })
            }
            collectParts(payload.parts || [])

            let body = ''
            const walkParts = (parts = []) => {
                for (const p of parts) {
                    if (p.mimeType === 'text/plain' && p.body && p.body.data) {
                        body = decodeBase64Url(p.body.data.replace(/-/g, '+').replace(/_/g, '/'))
                        return
                    }
                    if (p.parts) walkParts(p.parts)
                }
            }
            if (payload.mimeType === 'text/plain' && payload.body && payload.body.data) {
                body = decodeBase64Url(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
            } else {
                walkParts(payload.parts || [])
            }

            detailed.push({
                id: msg.data.id,
                threadId: msg.data.threadId,
                subject: headers['subject'] || '',
                from: headers['from'] || '',
                to: headers['to'] || '',
                date: headers['date'] || '',
                snippet: msg.data.snippet || '',
                internalDate,
                attachmentNames,
                body,
            })
        }

        detailed.sort((a, b) => a.internalDate - b.internalDate)

        res.json({ ok: true, messages: detailed })
    } catch (err) {
        console.error(err)
        res.status(500).json({ ok: false, error: String(err.message || err) })
    }
})

app.post('/api/sheets/update-row', async (req, res) => {
    try {
        const { spreadsheetId, sheetName, rowNumber, values } = req.body

        console.log('[sheets.update-row] request body:', { spreadsheetId, sheetName, rowNumber, values })

        if (!spreadsheetId || !sheetName || !rowNumber || !Array.isArray(values)) {
            return res.status(400).json({ ok: false, error: 'spreadsheetId, sheetName, rowNumber, values required' })
        }

        const auth = await getAuth()
        const sheets = google.sheets({ version: 'v4', auth })

        const range = `${sheetName}!A${rowNumber}`

        let updateRes
        try {
            updateRes = await sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [values],
                },
            })
        } catch (googleErr) {
            console.error('[sheets.update-row] Google API error:', googleErr)
            // If googleErr has a response body, surface it
            if (googleErr?.response?.data) {
                return res.status(500).json({ ok: false, error: 'Google API error', details: googleErr.response.data })
            }
            return res.status(500).json({ ok: false, error: String(googleErr?.message || googleErr) })
        }

        res.json({ ok: true, updatedRange: updateRes.data.updatedRange, updatedCells: updateRes.data.updatedCells })
    } catch (err) {
        console.error('[sheets.update-row] unexpected error:', err)
        // include response body if available
        if (err?.response?.data) {
            return res.status(500).json({ ok: false, error: 'Unexpected error', details: err.response.data })
        }
        res.status(500).json({ ok: false, error: String(err.message || err) })
    }
})

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
    console.log(`Demo backend listening on http://localhost:${PORT}`)
})


app.get("/",
    (req, res) => {
        res.send("Hi from workflow-builder demo backend, thnx for testing hehe")
    }
)