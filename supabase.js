// ============================================================
//  Bullfrog Tools – Supabase-Verbindung & User-Management
// ============================================================

// 🔧 Supabase SDK importieren
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
//  1️⃣ Projekt-Konfiguration
// ============================================================
// 👉 Trage hier deine Projektdaten aus Supabase ein:
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";

// 🔗 Verbindung einmalig erstellen
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  2️⃣ Authentifizierungs-Funktionen
// ============================================================

/**
 * Registrierung eines neuen Users
 * - Der erste Benutzer wird automatisch Admin
 * - Alle weiteren müssen durch Admin freigeschaltet werden
 */
export async function registerUser(username, password) {
  try {
    // Prüfen ob Name vergeben ist
    const { data: existing, error: checkErr } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (checkErr) throw checkErr;
    if (existing) {
      return { success: false, message: "Dieser Benutzername ist bereits vergeben." };
    }

    // Prüfen ob es schon Admins gibt
    const { count, error: countErr } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    if (countErr) throw countErr;
    const isFirstUser = count === 0;

    // Fake-Mail generieren (da Auth Mail braucht)
    const email = `${username}@bullfrog.fake`;

    // Supabase Auth erstellen
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Eintrag in Tabelle "users"
    const role = isFirstUser ? "admin" : "member";
    const status = isFirstUser ? "active" : "pending";

    const { error: insertErr } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        username,
        role,
        status,
      },
    ]);

    if (insertErr) throw insertErr;

    // Rückmeldung
    if (isFirstUser) {
      return {
        success: true,
        message:
          "Registrierung erfolgreich. Du bist der erste Benutzer und wurdest als Admin angelegt.",
      };
    } else {
      return {
        success: true,
        message:
          "Registrierung erfolgreich. Ein Admin muss dich noch freischalten, bevor du dich einloggen kannst.",
      };
    }
  } catch (err) {
    console.error("Registrierungsfehler:", err.message);
    return { success: false, message: "Fehler bei der Registrierung: " + err.message };
  }
}

/**
 * Anmeldung eines Users mit Username (nicht E-Mail)
 */
export async function loginUser(username, password) {
  try {
    // E-Mail erzeugen, falls du Fake-Mail nutzt
    const email = `${username}@bullfrog.fake`;

    // Anmeldung bei Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;

    // Benutzerprofil laden
    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (profileErr) throw profileErr;
    if (!profile) throw new Error("Benutzerprofil nicht gefunden");

    // Status prüfen
    if (profile.status !== "active") {
      await supabase.auth.signOut();
      return {
        success: false,
        message:
          profile.status === "pending"
            ? "Dein Account wurde erstellt, ist aber noch nicht freigeschaltet. Bitte warte auf die Freigabe durch einen Admin."
            : "Dein Account ist derzeit gesperrt."
      };
    }

    // Erfolg → lokale Daten speichern
    localStorage.setItem("username", profile.username);
    localStorage.setItem("role", profile.role);
    return { success: true, message: `Willkommen ${profile.username}!` };
  } catch (err) {
    console.error("Login-Fehler:", err.message);
    return { success: false, message: "Login fehlgeschlagen: " + err.message };
  }
}

/**
 * Logout / Session beenden
 */
export async function logoutUser() {
  await supabase.auth.signOut();
  localStorage.clear();
}

// ============================================================
//  3️⃣ User-Datenbank-Funktionen
// ============================================================

/**
 * Benutzerprofil anhand der Auth-ID abrufen
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Liste aller Benutzer (nur für Admins)
 */
export async function listUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, role, status")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateUserStatus(id, newStatus) {
  const { error } = await supabase.from("users").update({ status: newStatus }).eq("id", id);
  if (error) throw error;
}

export async function changeUserRole(id, newRole) {
  const { error } = await supabase.from("users").update({ role: newRole }).eq("id", id);
  if (error) throw error;
}

export async function deleteUser(id) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
//  4️⃣ Zusatzfunktionen (Vorbereitung für spätere Tools)
// ============================================================

/**
 * CSV-Daten hochladen oder ersetzen
 */
export async function uploadCSV(rows) {
  // Beispielhafte Struktur
  const { error } = await supabase.from("islands").upsert(rows);
  if (error) throw new Error(error.message);
  return true;
}

/**
 * CSV-Daten abrufen
 */
export async function getCSV() {
  const { data, error } = await supabase.from("islands").select("*");
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Diplomatie-Status speichern (z. B. Freund/Feind/Neutral)
 */
export async function setDiplomacy(alliance, status) {
  const { error } = await supabase
    .from("diplomacy")
    .upsert({ alliance, status }, { onConflict: ["alliance"] });
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Diplomatie-Liste abrufen
 */
export async function getDiplomacy() {
  const { data, error } = await supabase.from("diplomacy").select("*");
  if (error) throw new Error(error.message);
  return data;
}

// ============================================================
//  Ende der Datei
// ============================================================