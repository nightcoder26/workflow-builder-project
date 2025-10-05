const { google } = require('googleapis');
require('dotenv').config();
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost'
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter the authorization code here: ', async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Your refresh token (put this in .env as GOOGLE_REFRESH_TOKEN):');
        console.log(tokens.refresh_token);
        rl.close();
    } catch (err) {
        console.error('Error exchanging code for token:', err);
        rl.close();
    }
});
