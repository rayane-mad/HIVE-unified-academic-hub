const db = require('../db');

async function fixSchema() {
    try {
        console.log("🛠️ Fixing Schema...");

        // 1. Enable UUID extension
        await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        console.log("✅ UUID extension enabled.");

        // 2. Create Connected Accounts Table (User's Schema)
        // We drop it if it exists to ensure it has the correct schema (UUIDs)
        // WARNING: This deletes existing connections, but it's a dev env.
        await db.query(`DROP TABLE IF EXISTS connected_accounts CASCADE;`);

        await db.query(`
      CREATE TABLE connected_accounts (
        account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        platform_user_id VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_sync TIMESTAMP WITH TIME ZONE,
        CONSTRAINT unique_user_platform UNIQUE (user_id, platform)
      );
    `);
        console.log("✅ 'connected_accounts' table created with UUID support.");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error fixing schema:", err.message);
        if (err.message.includes('type "uuid" does not exist')) {
            console.error("   -> Postgres UUID extension missing or not supported on this user.");
        }
        if (err.message.includes('foreign key constraint')) {
            console.error("   -> FK Error: 'users.user_id' might NOT be UUID. Check 'users' table type.");
        }
        process.exit(1);
    }
}

fixSchema();
