const db = require('../db');

async function initDb() {
    try {
        console.log("🛠️ Initializing Database...");

        // 1. Create Users Table (if not exists - likely already there)
        await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("✅ Users table checked/created.");

        // 2. Create Connected Accounts Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS connected_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, platform)
      );
    `);
        console.log("✅ Connected_accounts table checked/created.");

        console.log("🎉 Database initialization complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error initializing database:", err);
        process.exit(1);
    }
}

initDb();
