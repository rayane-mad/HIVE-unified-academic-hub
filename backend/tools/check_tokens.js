const db = require('./db');
require('dotenv').config();

async function checkTokens() {
    try {
        const res = await db.query(
            `SELECT user_id, platform, 
             LEFT(access_token, 15) as token_preview,
             LENGTH(access_token) as token_length,
             last_sync 
             FROM connected_accounts 
             ORDER BY platform`
        );

        console.log('\n📊 Connected Accounts in Database:\n');
        console.log(JSON.stringify(res.rows, null, 2));

        // Also check if tokens exist in .env
        console.log('\n📋 Environment Variables:');
        console.log('OUTLOOK_CLIENT_ID:', process.env.OUTLOOK_CLIENT_ID?.substring(0, 10) + '...');
        console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkTokens();
