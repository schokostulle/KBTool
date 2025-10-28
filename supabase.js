// ===========================================================
// ⚓ Supabase-Konfiguration
// ===========================================================

// Deine Projekt-URL und dein API-Key (SERVICE_ROLE NICHT verwenden!)
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co"; // ← dein Projekt
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo"; // ⚠️ füge hier deinen anon-key ein

// Supabase-Client erstellen
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===========================================================
// ⚓ Aktuell eingeloggten Benutzer abrufen
// ===========================================================
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Fehler beim Abrufen des aktuellen Benutzers:", error.message);
    return null;
  }
  return data.user;
}

// ===========================================================
// ⚓ Sitzung prüfen und ggf. umleiten
// ===========================================================
// Diese Funktion kann auf jeder Seite genutzt werden, um sicherzustellen,
// dass nur authentifizierte Benutzer Zugriff haben.
export async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session;

  if (error || !session) {
    console.warn("⚠️ Keine aktive Sitzung gefunden.");
    window.location.href = "loadingscreen.html";
    return null;
  }

  return session.user;
}

// ===========================================================
// ⚓ Logout-Funktion
// ===========================================================
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Fehler beim Logout:", error.message);
    alert("Fehler beim Abmelden.");
    return;
  }
  window.location.href = "index.html";
}

// ===========================================================
// ⚓ Utility: User-Rolle prüfen (Admin / Member)
// ===========================================================
// Diese Funktion hilft, in Frontend-Komponenten schnell zu entscheiden,
// ob der aktuelle Benutzer Adminrechte hat.
export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("members")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Fehler beim Prüfen der Rolle:", error.message);
    return false;
  }

  return data?.role === "admin";
}

// ===========================================================
// ⚓ Utility: User-Status abrufen
// ===========================================================
export async function getUserStatus() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Fehler beim Abrufen des Benutzerstatus:", error.message);
    return null;
  }

  return data?.status;
}