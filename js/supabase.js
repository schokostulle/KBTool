// =========================================================
// FILE: JS/supabase.js
// DESCRIPTION: Verbindung zum Supabase Backend
// =========================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ---------------------------------------------------------
// Deine Projektkonfiguration
// ---------------------------------------------------------
// Diese Werte kommen aus Supabase Dashboard → Settings → API
// 1. "Project URL"
// 2. "anon public key"
// ---------------------------------------------------------

const SUPABASE_URL = 'https://xgdybrinpypeppdswheb.supabase.co';      // ← ersetzen
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo';            // ← ersetzen

// ---------------------------------------------------------
// Supabase Client erstellen
// ---------------------------------------------------------
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("✅ Supabase Client erfolgreich initialisiert");