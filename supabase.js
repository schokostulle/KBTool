// ===============================
// 🐸 Bullfrog Tools – Supabase.js
// ===============================

// 🔗 Verbindung zu deinem Supabase-Projekt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co"; // <--- anpassen!
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo"; // <--- anpassen!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===============================
// 🔑 AUTHENTIFIZIERUNG
// ===============================

// Registrierung mit Fake-Mail & Anlage in users
export async function register(username, password) {
  const email = `${username}@bullfrog.local`;

  // 1️⃣ Benutzer in Supabase Auth anlegen
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error("Registrierung fehlgeschlagen.");

  // 2️⃣ Eintrag in Tabelle 'users' anlegen
  const { error: insertError } = await supabase.from("users").insert([
    {
      id: user.id,
      name: username,
      role: "member",
      status: "pending",
      theme: "dark",
    },
  ]);

  if (insertError) throw insertError;

  alert("Registrierung erfolgreich! Ein Admin muss dich noch freischalten.");
}

// Login mit Prüfungen
export async function login(username, password) {
  const email = `${username}@bullfrog.local`;

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