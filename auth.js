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

  // Supabase Registrierung
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

  // Supabase Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Fehler beim Login:", error.message);
    alert("❌ Anmeldung fehlgeschlagen:\n" + error.message);
    return;
  }

  // Erfolgreich -> weiter zum Ladebildschirm
  window.location.href = "loadingscreen.html";
});

// ===========================================================
// ⚓ Automatische Session-Wiederherstellung (optional)
// ===========================================================
// Diese Logik sorgt dafür, dass ein eingeloggter Nutzer, der zurück auf index.html geht,
// automatisch wieder in loadingscreen.html weitergeleitet wird.
(async () => {
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session;
  if (session) {
    console.log("✅ Session aktiv – leite zum Dashboard weiter.");
    window.location.href = "loadingscreen.html";
  }
})();