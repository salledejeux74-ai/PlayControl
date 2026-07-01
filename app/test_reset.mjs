import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfpodinmhkzzpjlgqvoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcG9kaW5taGt6enBqbGdxdm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg5ODMzNywiZXhwIjoyMDk4NDc0MzM3fQ.Wq1_BHRWPwST3fdrJA45qFlLAYBDWOfdv7ge5Uhpi1I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const managerId = '22222222-2222-2222-2222-222222222222';
  const randPass = 'testpass123';
  
  console.log('--- Step 1: Updating auth user ---');
  const { data: authData, error: authErr } = await supabase.auth.admin.updateUserById(
    managerId,
    {
      password: randPass,
      user_metadata: {
        temp_password: randPass
      }
    }
  );
  
  if (authErr) {
    console.error('Auth update error:', authErr);
    return;
  }
  console.log('Auth update success! User metadata:', authData.user.user_metadata);

  console.log('--- Step 2: Updating profiles table ---');
  const { data: profData, error: profErr } = await supabase
    .from('profiles')
    .update({ temp_password: randPass })
    .eq('id', managerId)
    .select();
    
  if (profErr) {
    console.error('Profile update error:', profErr);
    return;
  }
  console.log('Profile update success! Profiles returned:', profData);

  console.log('--- Step 3: Testing login with new password ---');
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'salle.admin@playcontrol.com',
    password: randPass
  });

  if (loginErr) {
    console.error('Login failed:', loginErr.message);
  } else {
    console.log('Login succeeded! Logged in user:', loginData.user.email);
  }
}

run();
