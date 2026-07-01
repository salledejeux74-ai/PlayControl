import pg from 'pg';

const { Client } = pg;

const connectionString = 'postgresql://postgres:Pl%40yControl%402026@db.jfpodinmhkzzpjlgqvoa.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  await client.connect();
  try {
    const res = await client.query("SELECT id, email, encrypted_password FROM auth.users WHERE email = 'superadmin@playcontrol.com'");
    console.log('Result:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
