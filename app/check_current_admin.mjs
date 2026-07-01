import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfpodinmhkzzpjlgqvoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcG9kaW5taGt6enBqbGdxdm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg5ODMzNywiZXhwIjoyMDk4NDc0MzM3fQ.Wq1_BHRWPwST3fdrJA45qFlLAYBDWOfdv7ge5Uhpi1I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const email = 'salle.admin@playcontrol.com';
  console.log(`--- Checking user: ${email} ---`);
  
  // 1. Get profile
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
    
  if (pErr) {
    console.error('Error fetching profile:', pErr.message);
  } else {
    console.log('Profile in DB:', profile);
  }
  
  // 2. Get auth user details
  const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) {
    console.error('Error listing auth users:', uErr.message);
  } else {
    const authUser = users.find(u => u.email === email);
    if (authUser) {
      console.log('Auth user details:', {
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata,
        last_sign_in_at: authUser.last_sign_in_at,
        updated_at: authUser.updated_at
      });
    } else {
      console.log('User not found in Auth!');
    }
  }
}

check();
