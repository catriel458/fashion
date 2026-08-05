const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Error reading .env.local:", e);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined in .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    console.log("Checking database...");
    
    // Check users and roles
    const users = await sql`SELECT id, email, role, max_stores FROM users`;
    console.log("\nUsers in DB:", users);

    // Check shoppings
    const shoppings = await sql`SELECT * FROM shoppings`;
    console.log("\nShoppings in DB:", shoppings);

    // Check stores
    const stores = await sql`SELECT id, name, slug, shopping_id, is_independent FROM stores`;
    console.log("\nStores in DB:", stores);

    // Check check constraint on users
    const checkConstraints = await sql`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conname LIKE '%role%';
    `;
    console.log("\nRole Check Constraints:", checkConstraints);

  } catch (err) {
    console.error("Error checking database:", err);
  }
}

main();
