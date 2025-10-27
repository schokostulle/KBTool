// ======================================
// Supabase-Konfiguration
// ======================================
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==== Kleine Utils ====
window.App = {
  supabase,
  $: (s) => document.querySelector(s),
  formatDE(dt) {
    try { return new Date(dt).toLocaleString("de-DE"); } catch { return dt || ""; }
  }
};