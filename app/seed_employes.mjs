import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kkjvujdjhpfyzicfibqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtranZ1amRqaHBmeXppY2ZpYnF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjE0NDU2MiwiZXhwIjoyMDk3NzIwNTYyfQ.egOcyOIeNudlJ2wkBg8FYaebzmp7aYpjmUOrGaRPF88';

const supabase = createClient(supabaseUrl, supabaseKey);

const paulSalleId = '9315cd40-eec4-412c-9ef3-d1daac605dff';

const mockEmployees = [
  {
    email: 'sophie.caisse@playcontrol.com',
    name: 'Sophie Caisse',
    phone: '+237 699 12 34 56',
    status: 'active',
    temp_password: 'password'
  },
  {
    email: 'jean.b@playcontrol.com',
    name: 'Jean Bernard',
    phone: '+225 07 12 34 56 78',
    status: 'active',
    temp_password: 'password'
  },
  {
    email: 'marie.n@playcontrol.com',
    name: 'Marie Ngo',
    phone: '+237 677 88 99 00',
    status: 'suspended',
    temp_password: 'password'
  }
];

async function run() {
  console.log('Seeding employees for room:', paulSalleId);

  for (const emp of mockEmployees) {
    console.log(`Traitement de ${emp.name} (${emp.email})...`);
    
    // 1. Check if user already exists in auth by querying profiles (since we cannot query auth.users directly)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emp.email)
      .maybeSingle();

    if (existingProfile) {
      console.log(`L'utilisateur ${emp.email} existe déjà dans les profils avec ID: ${existingProfile.id}. Mise à jour du profil...`);
      
      // Update profile
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          name: emp.name,
          role: 'caissier',
          salle_id: paulSalleId,
          phone: emp.phone,
          status: emp.status,
          temp_password: emp.temp_password
        })
        .eq('id', existingProfile.id);

      if (updateErr) {
        console.error(`Erreur lors de la mise à jour du profil pour ${emp.email}:`, updateErr);
      } else {
        console.log(`Profil mis à jour pour ${emp.email}.`);
      }
    } else {
      // 2. Create user in auth
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: emp.email,
        password: emp.temp_password,
        email_confirm: true,
        user_metadata: {
          name: emp.name,
          role: 'caissier',
          salle_id: paulSalleId,
          temp_password: emp.temp_password,
          phone: emp.phone,
          status: emp.status
        }
      });

      if (authErr) {
        console.error(`Erreur lors de la création de l'utilisateur auth pour ${emp.email}:`, authErr.message);
      } else if (authData.user) {
        console.log(`Utilisateur créé dans l'authentification avec ID: ${authData.user.id}.`);
        
        // Wait 1 second to let trigger handle creation, then update profile to ensure phone and status are set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            phone: emp.phone,
            status: emp.status,
            salle_id: paulSalleId,
            temp_password: emp.temp_password
          })
          .eq('id', authData.user.id);
          
        if (profileErr) {
          console.error(`Erreur lors de la mise à jour des détails additionnels du profil pour ${emp.email}:`, profileErr);
        } else {
          console.log(`Profil complété avec succès pour ${emp.email}.`);
        }
      }
    }
  }
  
  console.log('Seeding des employés terminé.');
}

run();
