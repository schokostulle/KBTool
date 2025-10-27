// === Supabase Setup ===
// Ersetze diese Platzhalter mit deinen echten Projektwerten:
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co"; // <- einfügen
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";                   // <- einfügen

// Supabase Client erstellen (v2)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === UI Helper ===
const $ = (sel) => document.querySelector(sel);
const feedback = (msg, kind = "") => {
  const box = $("#feedback");
  box.textContent = msg;
  box.className = `feedback ${kind}`.trim();
};

// Tabs
const tabLogin = $("#tab-login");
const tabRegister = $("#tab-register");
const panelLogin = $("#panel-login");
const panelRegister = $("#panel-register");

function activateTab(which) {
  const isLogin = which === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  tabLogin.setAttribute("aria-selected", String(isLogin));
  tabRegister.setAttribute("aria-selected", String(!isLogin));
  panelLogin.toggleAttribute("hidden", !isLogin);
  panelRegister.toggleAttribute("hidden", isLogin);
  panelLogin.classList.toggle("active", isLogin);
  panelRegister.classList.toggle("active", !isLogin);
  feedback("");
}

tabLogin.addEventListener("click", () => activateTab("login"));
tabRegister.addEventListener("click", () => activateTab("register"));

// === Auth: Login ===
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Maste werden gesetzt …");
  const email = e.target.email.value.trim();
  const password = e.target.password.value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    feedback(`Anmeldung fehlgeschlagen: ${error.message}`, "error");
  } else {
    feedback("Anmeldung erfolgreich. Willkommen an Bord!", "success");
    console.log("Session:", data.session);
    // TODO: Weiterleitung auf eine geschützte Seite – z.B. dashboard.html
    // window.location.href = "/dashboard.html";
  }
});

// === Auth: Registrierung (mit Passwort-Bestätigung) ===
$("#register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Anheuern …");

  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  const confirm = e.target.password_confirm.value;

  if (password !== confirm) {
    feedback("Die Passwörter stimmen nicht überein.", "error");
    return;
  }

  if (password.length < 8) {
    feedback("Passwort zu kurz (mind. 8 Zeichen).", "error");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Passe die Redirect‑URL an deine Domain / Umgebung an
      emailRedirectTo: window.location.origin + "/welcome.html",
    },
  });

  if (error) {
    feedback(`Registrierung fehlgeschlagen: ${error.message}`, "error");
    return;
  }

  // supabase v2: data.user (bei confirm-less) oder Mailbestätigung erforderlich
  if (data.user && !data.session) {
    feedback("Fast geschafft! Bestätige bitte deine E‑Mail, um an Bord zu kommen.", "success");
  } else {
    feedback("Registrierung erfolgreich. Willkommen an Bord!", "success");
  }
});

// Optional: Session-Änderungen beobachten
supabase.auth.onAuthStateChange((_event, session) => {
  console.log("Auth-Event:", _event, session);
});