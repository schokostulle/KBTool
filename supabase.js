// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ⚙️ Supabase-Projekt konfigurieren */
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";     // <– ersetzen!
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";                   // <– ersetzen!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ================================
   🔐 AUTHENTIFIZIERUNG
================================ */

/**
 * Registrierung eines neuen Users mit Fake-Mail.
 * Erstellt Auth-Account + Eintrag in users-Tabelle (status = 'geblockt')
 */
export async function registerUser(username, password) {
  const fakeEmail = `${username.toLowerCase()}@bullfrog.fake`;

  // 1️⃣ Registrierung bei Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: fakeEmail,
    password,
  });

  if (error) {
    alert("Registrierung fehlgeschlagen: " + error.message);
    return null;
  }

  // 2️⃣ Eintrag in eigene users-Tabelle
  const userId = data.user?.id;
  if (userId) {
    await supabase.from("users").insert({
      id: userId,
      username,
      email: fakeEmail,
      role: "member",
      status: "geblockt",
    });
  }

  alert(
    "Registrierung erfolgreich! Dein Account wird vom Admin geprüft und freigeschaltet."
  );
  return data.user;
}

/**
 * Login mit Username und Passwort
 */
export async function loginUser(username, password) {
  const fakeEmail = `${username.toLowerCase()}@bullfrog.fake`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password,
  });

  if (error) {
    alert("Login fehlgeschlagen: " + error.message);
    return null;
  }

  // 1️⃣ Benutzerdaten abrufen
  const { data: userRecord } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!userRecord) {
    alert("Benutzer nicht gefunden.");
    await logoutUser();
    return null;
  }

  // 2️⃣ Status prüfen
  if (userRecord.status !== "aktiv") {
    alert("Dein Account ist noch nicht freigeschaltet.");
    await logoutUser();
    return null;
  }

  // 3️⃣ Weiterleitung zum Dashboard
  window.location.href = "dashboard.html";
}

/**
 * Logout und Weiterleitung zur Startseite
 */
export async function logoutUser() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

/**
 * Aktuelle Session prüfen.
 * Leitet zurück zu index.html, wenn nicht eingeloggt oder geblockt.
 */
export async function checkSession(allowedRoles = ["member", "admin"]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return null;
  }

  // User-Daten abrufen
  const { data: userRecord } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userRecord || userRecord.deleted_at !== null) {
    await logoutUser();
    return null;
  }

  if (userRecord.status !== "aktiv") {
    alert("Dein Konto ist noch nicht aktiviert.");
    await logoutUser();
    return null;
  }

  if (!allowedRoles.includes(userRecord.role)) {
    alert("Kein Zugriff auf diese Seite.");
    window.location.href = "dashboard.html";
    return null;
  }

  return userRecord;
}