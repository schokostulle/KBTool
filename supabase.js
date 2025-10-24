// supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// === Deine Supabase-Verbindungsdaten ===
// → Diese Daten findest du im Supabase-Dashboard unter:
// Project Settings → API → Project URL & anon public key

const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";  // ⚠️ ersetzen
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";                     // ⚠️ ersetzen

// === Supabase-Client erstellen ===
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,   // bleibt nach Reload angemeldet
    autoRefreshToken: true, // Session automatisch verlängern
    detectSessionInUrl: true,
  },
});