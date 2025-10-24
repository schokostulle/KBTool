// ==============================================
// Bullfrog Tools – ursprüngliche Supabase-Version
// ==============================================

// Supabase SDK importieren
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase-Projekt konfigurieren
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";

// Verbindung herstellen
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====================================================
// Registrierung
// ====================================================
export async function Register(username, password) {
  try {
    const email = `${username}@bullfrog.fake`;

    // Nutzer bei Auth registrieren
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) throw error;

    // Prüfen, ob dies der erste Benutzer ist
    const { data: existingUsers, error: userError } = await supabase
      .from("users")
      .select("id");

    if (userError) throw userError;

    const isFirst = !existingUsers || existingUsers.length === 0;

    // Nutzer in Tabelle "users" eintragen
    const { error: insertError } = await supabase.from("users").insert([
      {
        id: data.user.id,
        username: username,
        role: isFirst ? "admin" : "member",
        status: isFirst ? "active" : "pending",
      },
    ]);

    if (insertError) throw insertError;

    return {
      success: true,
      role: isFirst ? "admin" : "member",
      message: isFirst
        ? "Admin-Konto erstellt. Willkommen!"
        : "Registrierung erfolgreich. Bitte auf Freischaltung warten.",
    };
  } catch (err) {
    console.error("Fehler bei Registrierung:", err.message);
    return { success: false, message: err.message };
  }
}

// ====================================================
// Anmeldung
// ====================================================
export async function Login(username, password) {
  try {
    const email = `${username}@bullfrog.fake`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (userErr) throw userErr;

    if (!userRow) {
      throw new Error("Benutzerprofil fehlt. Bitte Admin kontaktieren.");
    }

    if (userRow.status === "pending") {
      await supabase.auth.signOut();
      throw new Error("Dein Account ist noch nicht freigeschaltet.");
    }

    if (userRow.status === "blocked") {
      await supabase.auth.signOut();
      throw new Error("Dein Account wurde gesperrt. Bitte Admin kontaktieren.");
    }

    // Lokale Speicherung
    localStorage.setItem("username", userRow.username);
    localStorage.setItem("role", userRow.role);

    return { success: true, role: userRow.role };
  } catch (err) {
    console.error("Fehler bei Anmeldung:", err.message);
    return { success: false, message: err.message };
  }
}

// ====================================================
// Abmelden (Logout)
// ====================================================
export async function Logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (