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

const SUPABASE_URL = 'https://DEINPROJECT.supabase.co';      // ← ersetzen
const SUPABASE_ANON_KEY = 'DEIN_PUBLIC_ANON_KEY';            // ← ersetzen

// ---------------------------------------------------------
// Supabase Client erstellen
// ---------------------------------------------------------
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("✅ Supabase Client erfolgreich initialisiert");