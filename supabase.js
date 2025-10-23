// ===============================
// 🐸 Bullfrog Tools – Supabase.js
// ===============================

// 🔗 Verbindung zu deinem Supabase-Projekt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co"; // <--- anpassen!
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo"; // <--- anpassen!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================
// 🐸 Registrierung (supabase.js)
// =========================

export async function register(username, password) {
  const email = `${username}@bullfrog.game`; // gültige Fake-Mail

  // 1️⃣ Auth-Benutzer erstellen
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("Registrierung fehlgeschlagen.");

  // 2️⃣ Session aktivieren, damit auth.uid() in Policies verfügbar ist
  if (data.session) {
    await supabase.auth.setSession(data.session);
  }

  // 3️⃣ Prüfen, ob schon ein Benutzer existiert
  const { data: existingUsers, error: countError } = await supabase
    .from("users")
    .select("id", { count: "exact" });

  if (countError) throw countError;

  // 4️⃣ Wenn kein User existiert → erster = Admin
  const isFirstUser = !existingUsers || existingUsers.length === 0;

  const role = isFirstUser ? "admin" : "member";
  const status = isFirstUser ? "active" : "pending";

  // 5️⃣ Eintrag in users-Tabelle anlegen
  const { error: insertError } = await supabase.from("users").insert([
    {
      id: user.id,
      name: username,
      role,
      status,
      theme: "dark",
    },
  ]);

  if (insertError) throw insertError;

  // 6️⃣ Rückmeldung
  if (isFirstUser) {
    alert("Erster Benutzer registriert! Du bist jetzt Admin.");
  } else {
    alert("Registrierung erfolgreich! Ein Admin muss dich noch freischalten.");
  }
}

// Login mit Prüfungen
export async function login(username, password) {
  const email = `${username}@bullfrog.fake`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("Login fehlgeschlagen.");

  // 3️⃣ Benutzerstatus prüfen
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("status")
    .eq("id", user.id)
    .single();

  if (profileError) throw profileError;
  if (!profile) throw new Error("Benutzerprofil nicht gefunden.");
  if (profile.status !== "active") {
    throw new Error("Dein Konto ist noch nicht freigeschaltet.");
  }

  // Login erfolgreich
  window.location.href = "dashboard.html";
}

// Logout
export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// ===============================
// 📋 HILFSFUNKTIONEN FÜR DASHBOARD
// ===============================

// Aktuell eingeloggten Benutzer abrufen
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

// Benutzerprofil laden
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

// Ereignisse aus Tabelle "events" laden
export async function loadEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}