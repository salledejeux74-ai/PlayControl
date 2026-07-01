import dns from 'dns';

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'ca-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'sa-east-1'
];

async function check() {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    try {
      await new Promise((resolve, reject) => {
        dns.lookup(host, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`Region found: ${r} (${host})`);
    } catch (err) {
      // Not found
    }
  }
}

check();
