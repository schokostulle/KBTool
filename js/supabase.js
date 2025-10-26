// =========================================================
// BLOCK 6: supabase.js – Verbindung zum Supabase-Backend
// =========================================================

// Supabase-Bibliothek aus dem offiziellen CDN laden
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// =========================================================
// BLOCK: Projekt-Konfiguration
// =========================================================

// HINWEIS:
// - Trage hier deine eigene Projekt-URL und den "Public Anon Key" ein.
// - Diese Daten findest du im Supabase-Dashboard unter:
//   Settings → API → Project URL & anon public key.

const SUPABASE_URL = 'https://xgdybrinpypeppdswheb.supabase.co';       // <-- hier ersetzen
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo';             // <-- hier ersetzen

// =========================================================
// BLOCK: Client-Erstellung
// =========================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================================
// BLOCK: Funktions-Test (optional für Anfänger)
// =========================================================

// Diese Zeile schreibt bei erfolgreicher Verbindung eine Meldung in die Konsole.
// Du kannst sie löschen, wenn alles läuft.
console.log('✅ Supabase-Client erfolgreich initialisiert');