<script type="module">
// ==============================
// 🐸 Bullfrog Tools – Supabase.js
// ==============================

// Deine Supabase-Projekt-Daten hier einfügen:
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// 🔐 Authentifizierung
// ==============================

export async function register(name, password) {
  if (!name || !password) throw new Error("Bitte Name und Passwort eingeben.");
  const email = `${name.toLowerCase()}@bullfrog.local`; // Fake-Email
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  const user = data.user;
  console.log("User registriert:", user.id);

  // Prüfen, ob erster Nutzer
  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  const isFirst = count === 0;

  const profile = {
    id: user.id,
    name,
    role: isFirst ? "admin" : "member",
    status: isFirst ? "active" : "pending",
    theme: "dark",
  };

  const { error: insertError } = await supabase.from("users").insert(profile);
  if (insertError) console.error("Fehler beim Speichern des Profils:", insertError);

  if (!isFirst) {
    alert("Registrierung erfolgreich! Ein Admin muss dich noch freischalten.");
    await supabase.auth.signOut();
    return;
  }

  location.href = "dashboard.html";
}

export async function login(name, password) {
  const email = `${name.toLowerCase()}@bullfrog.local`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Anmeldung fehlgeschlagen.");

  const user = data.user;
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();

  if (!profile) throw new Error("Benutzerprofil nicht gefunden.");

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    throw new Error("Dein Konto muss erst vom Admin freigeschaltet werden.");
  }

  localStorage.setItem("theme", profile.theme || "dark");
  location.href = "dashboard.html";
}

export async function logout() {
  await supabase.auth.signOut();
  location.href = "index.html";
}

// ==============================
// 👤 Benutzerinformationen laden
// ==============================

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getUserProfile(userId) {
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return data;
}

// ==============================
// 📰 Ereignisse
// ==============================

export async function loadEvents() {
  const { data, error } = await supabase.from("events").select("*").order("timestamp", { ascending: false });
  if (error) {
    console.error("Fehler beim Laden der Ereignisse:", error);
    return [];
  }
  return data || [];
}

export async function addEvent(title, message, author) {
  const { error } = await supabase.from("events").insert({
    id: crypto.randomUUID(),
    title,
    message,
    author,
  });
  if (error) console.error("Fehler beim Hinzufügen des Ereignisses:", error);
}

// ==============================
// 🎨 Theme speichern
// ==============================

export async function saveThemePreference(userId, theme) {
  localStorage.setItem("theme", theme);
  await supabase.from("users").update({ theme }).eq("id", userId);
}

// ==============================
// 🟢 Automatische Weiterleitung
// ==============================

supabase.auth.onAuthStateChange(async (event, session) => {
  if (!session) return; // nicht eingeloggt
  const user = session.user;
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();

  if (location.pathname.endsWith("index.html") && profile?.status === "active") {
    location.href = "dashboard.html";
  }
});
</script>