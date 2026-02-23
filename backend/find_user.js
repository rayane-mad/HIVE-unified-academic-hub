require('dotenv').config();
const db = require('./db');

async function findUser() {
    try {
        const res = await db.query("SELECT user_id, last_sync FROM connected_accounts WHERE platform = 'google' ORDER BY last_sync DESC LIMIT 1");
        console.log("Latest Google User:", res.rows[0]);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUser();
