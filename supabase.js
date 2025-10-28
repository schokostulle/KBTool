// supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co"; // deine Supabase-URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo"; // 🔒 ersetze ggf. mit deinem tatsächlichen Public Key

// Supabase Client erstellen mit Session-Persistenz
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,       // 🔹 hält User-Session im LocalStorage
    autoRefreshToken: true,     // 🔹 erneuert Tokens automatisch
    detectSessionInUrl: true,   // 🔹 erkennt Redirects (z. B. Magic Link)
    storage: localStorage,      // 🔹 speichert Session im Browser
  },
});

// Hilfsfunktionen

// Aktuell eingeloggten Benutzer abrufen
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn("Fehler beim Abrufen des Benutzers:", error.message);
    return null;
  }
  return data?.user || null;
}

// Abmelden & zurück zur Startseite
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout-Fehler:", error.message);
  }
  location.href = "index.html";
}