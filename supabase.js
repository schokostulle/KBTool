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
  const email = `${username}@bullfrog.fake`;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);

  // Prüfen, ob dies der erste User ist
  const { data: users } = await supabase.from("users").select("id");
  const isFirst = !users || users.length === 0;

  // Profil anlegen
  const { error: insertErr } = await supabase.from("users").insert({
    id: data.user.id,
    username,
    role: isFirst ? "admin" : "member",
    status: isFirst ? "active" : "pending",
  });
  if (insertErr) throw new Error(insertErr.message);

  return { role: isFirst ? "admin" : "member", id: data.user.id };
}

/**
 * Anmeldung eines Users mit Username (nicht E-Mail)
 */
export async function loginUser(username, password) {
  const email = `${username}@bullfrog.fake`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Anmeldung fehlgeschlagen");
  return data.user;
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
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Benutzer-Status ändern (pending / active / blocked / denied)
 */
export async function updateUserStatus(id, status) {
  const { error } = await supabase.from("users").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Benutzer-Rolle ändern (admin / member)
 */
export async function changeUserRole(id, role) {
  const { error } = await supabase.from("users").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

/**
 * Benutzer aus der Datenbank löschen
 */
export async function deleteUser(id) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
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