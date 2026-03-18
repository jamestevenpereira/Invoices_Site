const fs = require('fs');
const path = require('path');

const templateFile = path.join(__dirname, '../src/environments/environment.prod.template.ts');
const outputFile = path.join(__dirname, '../src/environments/environment.prod.ts');

let content = fs.readFileSync(templateFile, 'utf8');

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl) {
  console.warn('WARNING: SUPABASE_URL is not set — placeholder will remain in output.');
}
if (!supabaseAnonKey) {
  console.warn('WARNING: SUPABASE_ANON_KEY is not set — placeholder will remain in output.');
}

content = content
  .replaceAll('%%SUPABASE_URL%%', supabaseUrl)
  .replaceAll('%%SUPABASE_ANON_KEY%%', supabaseAnonKey);

fs.writeFileSync(outputFile, content);
console.log('Environment injected.');
