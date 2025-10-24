import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔧 Deine Supabase-Daten:
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔒 Benutzer-Abmeldung
export async function logout() {
  await supabase.auth.signOut();
  alert("Abgemeldet.");
  window.location.href = "index.html";
}

// 🔍 Sitzung prüfen
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.user;
}