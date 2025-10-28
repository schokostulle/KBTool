import { supabase } from "./supabase.js";

// === Formular-Referenzen ===
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

// ===========================================================
// ⚓ Registrierung
// ===========================================================

registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const email = `${username}@bullfrog.fake`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  if (error) return alert(error.message);

  // Warten bis der User-Context da ist
  let userId = null;
  for (let i = 0; i < 20; i++) {
    const { data: u } = await supabase.auth.getUser();
    userId = u?.user?.id || null;
    if (userId) break;
    await new Promise(r => setTimeout(r, 150));
  }
  if (!userId) return alert('Registrierung ok, aber Session noch nicht verfügbar. Bitte erneut einloggen.');

  // WICHTIG: eigenen members-Eintrag anlegen (RLS-Policy erlaubt das jetzt)
  const { error: insErr } = await supabase.from('members').insert({
    id: userId,
    username: username,
    role: 'member',
    status: 'blocked'
  });
  if (insErr) {
    console.warn('Hinweis: Konnte members-Eintrag nicht anlegen:', insErr.message);
    // Nicht fatal für die Registrierung – Admin kann später freischalten
  }

  alert('Registrierung erfolgreich – bitte auf Freischaltung warten.');
  // optional: weiterleiten
  window.location.href = 'loadingscreen.html';
});

// ===========================================================
// ⚓ Login
// ===========================================================
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("loginName").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const email = `${username}@bullfrog.fake`;

  if (!username || !password) {
    alert("Bitte Benutzernamen und Passwort eingeben.");
    return;
  }

  // Login-Versuch
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("❌ Anmeldung fehlgeschlagen:\n" + error.message);
    console.error(error);
    return;
  }

  console.log("✅ Login erfolgreich. Warte auf Session...");

  // Warte aktiv, bis Supabase-Session wirklich existiert
  let sessionReady = false;
  for (let i = 0; i < 10; i++) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      sessionReady = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (!sessionReady) {
    alert("⚠️ Sitzung konnte nicht initialisiert werden. Bitte erneut versuchen.");
    return;
  }

  console.log("✅ Session aktiv – weiter zur Lade-Seite.");
  // nach erfolgreichem Login
setTimeout(() => {
  window.location.href = "loadingscreen.html";
}, 200);
});

// ===========================================================
// ⚓ Automatische Weiterleitung bei bestehender Session
// ===========================================================
(async () => {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (session && window.location.pathname.endsWith("index.html")) {
    console.log("🔁 Benutzer bereits eingeloggt – Weiterleitung...");
    window.location.href = "loadingscreen.html";
  }
})();