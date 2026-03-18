const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/environments/environment.prod.ts');
let content = fs.readFileSync(file, 'utf8');
content = content
  .replace('%%SUPABASE_URL%%', process.env.SUPABASE_URL ?? '')
  .replace('%%SUPABASE_ANON_KEY%%', process.env.SUPABASE_ANON_KEY ?? '');
fs.writeFileSync(file, content);
console.log('Environment injected.');
