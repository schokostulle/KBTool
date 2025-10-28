import { supabase } from "./supabase.js";

// === Formular-Referenzen ===
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

// ===========================================================
// ⚓ Registrierung
// ===========================================================
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const email = `${username}@bullfrog.fake`;

  if (!username || !password) {
    alert("Bitte Benutzernamen und Passwort eingeben.");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    console.error("Fehler bei Registrierung:", error.message);
    alert("❌ Registrierung fehlgeschlagen:\n" + error.message);
    return;
  }

  alert("✅ Registrierung erfolgreich.\nBitte auf Freischaltung durch einen Admin warten.");
  registerForm.reset();
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
    console.error("Fehler beim Login:", error.message);
    alert("❌ Anmeldung fehlgeschlagen:\n" + error.message);
    return;
  }

  console.log("✅ Login erfolgreich. Weiterleitung zur Lade-Seite...");
  // Verzögerung, damit Supabase-Session gesetzt wird, bevor redirect erfolgt
  setTimeout(() => {
    window.location.href = "loadingscreen.html";
  }, 300);
});

// ===========================================================
// ⚓ Automatische Session-Wiederherstellung
// ===========================================================
// Wenn der Nutzer bereits eingeloggt ist → direkt weiterleiten
(async () => {
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session;

  if (session && window.location.pathname.endsWith("index.html")) {
    console.log("🔁 Benutzer bereits eingeloggt – Weiterleitung zur Lade-Seite.");
    window.location.href = "loadingscreen.html";
  }
})();