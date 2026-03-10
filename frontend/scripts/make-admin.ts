import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function makeAdmin(email: string) {
  const { rowCount } = await pool.query(
    `UPDATE "user" SET role = 'admin' WHERE email = $1`, [email]
  );
  console.log(rowCount ? `✅ ${email} is now admin` : `❌ User not found: ${email}`);
  await pool.end();
}

makeAdmin(process.argv[2]);
