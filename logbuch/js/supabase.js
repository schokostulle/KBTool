// === supabase.js (Browser-kompatible Version) ===
// Stelle sicher, dass diese Datei NACH dem supabase CDN-Import geladen wird:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>

const SUPABASE_URL = "https://bbeczprdumbeqcutqopr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZWN6cHJkdW1iZXFjdXRxb3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjMzMTgsImV4cCI6MjA3NzMzOTMxOH0.j2DiRK_40cSiFOM8KdA9DzjLklC9hXH_Es6mHPOvPQk"; // ← bitte echten Key einfügen

// Supabase Client global verfügbar machen
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Optional: für Debugging
console.log("✅ Supabase verbunden:", SUPABASE_URL);