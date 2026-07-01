import dns from 'dns';

dns.resolveAny('db.jfpodinmhkzzpjlgqvoa.supabase.co', (err, addresses) => {
  if (err) {
    console.error('Error resolving db host:', err);
  } else {
    console.log('Addresses:', addresses);
  }
});

dns.resolveAny('jfpodinmhkzzpjlgqvoa.supabase.co', (err, addresses) => {
  if (err) {
    console.error('Error resolving project host:', err);
  } else {
    console.log('Project Addresses:', addresses);
  }
});
