// Values are substituted at build time by scripts/inject-env.js.
// Do NOT use process.env here — this file is compiled into the browser bundle.
export const environment = {
  production: true,
  supabaseUrl: '%%SUPABASE_URL%%',
  supabaseAnonKey: '%%SUPABASE_ANON_KEY%%',
};
