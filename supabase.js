// supabase.js
// ==========================================
// Bullfrog Tools – Verbindung & Auth-Logik
// ==========================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔧 deine Projektdaten hier einsetzen:
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co"; // <--- anpassen!
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo"; // <--- anpassen!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------------------------------------
// 🧭 Registrierung eines neuen Benutzers
// -------------------------------------------------
export async function register(username, password) {
  const email = `${username}@bullfrog.fake`;

  try {
    // 1️⃣ Benutzer bei Supabase-Auth anlegen
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    const user = data.user;
    if (!user) throw new Error("Registrierung fehlgeschlagen");

    // 2️⃣ Session setzen, damit auth.uid() bekannt ist
    if (data.session) await supabase.auth.setSession(data.session);

    // 3️⃣ Prüfen, ob schon Benutzer existieren → erster wird Admin
    const { data: existing, error: selErr } = await supabase
      .from("users")
      .select("id");
    if (selErr) throw selErr;

    const isFirst = !existing || existing.length === 0;
    const role = isFirst ? "admin" : "member";
    const status = isFirst ? "active" : "pending";

    // 4️⃣ Benutzer in public.users eintragen
    const { error: insErr } = await supabase.from("users").insert([
      {
        id: user.id,
        name: username,
        role,
        status,
        theme: "dark",
        created_at: new Date().toISOString(),
      },
    ]);
    if (insErr) throw insErr;

    alert(
      isFirst
        ? "Erster Benutzer – du bist Admin!"
        : "Registrierung erfolgreich, warte auf Freischaltung durch einen Admin."
    );
  } catch (err) {
    console.error(err);
    alert("Fehler bei der Registrierung: " + err.message);
  }
}

// -------------------------------------------------
// 🔐 Anmeldung eines bestehenden Benutzers
// -------------------------------------------------
export async function login(username, password) {
  const email = `${username}@bullfrog.fake`;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Benutzer-Daten laden
    const user = data.user;
    const { data: profile, error: profErr } = await supabase
      .from("users")
      .select("role, status, theme")
      .eq("id", user.id)
      .single();
    if (profErr) throw profErr;

    if (profile.status !== "active") {
      alert("Dein Account muss erst vom Admin freigeschaltet werden.");
      await supabase.auth.signOut();
      return;
    }

    alert(`Willkommen zurück, ${username}!`);
    // Beispiel: Weiterleitung zum Dashboard
    // window.location.href = "dashboard.html";
  } catch (err) {
    console.error(err);
    alert("Login fehlgeschlagen: " + err.message);
  }
}

// -------------------------------------------------
// 🚪 Abmeldung
// -------------------------------------------------
export async function logout() {
  await supabase.auth.signOut();
  alert("Abgemeldet.");
  // window.location.href = "index.html";
}

// -------------------------------------------------
// 👀 Benutzer-Status prüfen (Session wiederherstellen)
// -------------------------------------------------
export async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  const user = data.session.user;

  // Benutzerprofil abrufen
  const { data: profile } = await supabase
    .from("users")
    .select("role, status, theme")
    .eq("id", user.id)
    .single();

  return { ...user, ...profile };
}

// -------------------------------------------------
// 🧩 Beispielhafte Event-Handler für Buttons
// -------------------------------------------------
document.getElementById("btnRegister")?.addEventListener("click", async () => {
  const u = document.getElementById("regUser").value.trim();
  const p = document.getElementById("regPass").value.trim();
  if (!u || !p) return alert("Bitte Benutzername & Passwort eingeben.");
  await register(u, p);
});

document.getElementById("btnLogin")?.addEventListener("click", async () => {
  const u = document.getElementById("logUser").value.trim();
  const p = document.getElementById("logPass").value.trim();
  if (!u || !p) return alert("Bitte Benutzername & Passwort eingeben.");
  await login(u, p);
});

document.getElementById("btnLogout")?.addEventListener("click", logout);