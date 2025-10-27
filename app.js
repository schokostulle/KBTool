// === Konfiguration ===
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === Hilfsfunktionen ===
const $ = (s) => document.querySelector(s);
const feedback = (msg, kind = "") => {
  const el = $("#feedback");
  el.textContent = msg;
  el.className = `feedback ${kind}`;
};
function sanitizeNickname(nick) {
  return nick.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9._-]/g, "");
}
function makeFakeEmail(nick) {
  return `${sanitizeNickname(nick)}@bullfrog.fake`;
}

// === Tab-Steuerung ===
$("#tab-login").addEventListener("click", () => switchTab("login"));
$("#tab-register").addEventListener("click", () => switchTab("register"));
function switchTab(which) {
  const isLogin = which === "login";
  $("#tab-login").classList.toggle("active", isLogin);
  $("#tab-register").classList.toggle("active", !isLogin);
  $("#panel-login").hidden = !isLogin;
  $("#panel-register").hidden = isLogin;
  feedback("");
}

// === Registrierung ===
$("#register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Registrierung läuft …");

  const nickname = sanitizeNickname(e.target.nickname.value);
  const password = e.target.password.value;
  const confirm = e.target.password_confirm.value;
  if (password !== confirm) return feedback("Passwörter stimmen nicht überein.", "error");

  const { data: existing } = await supabase.from("profiles").select("nickname").eq("nickname", nickname).maybeSingle();
  if (existing) return feedback("Nickname bereits vergeben.", "error");

  const email = makeFakeEmail(nickname);
  const { data: signData, error: signError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });
  if (signError) return feedback("Fehler: " + signError.message, "error");

  const user = signData.user;
  if (!user) return feedback("Fehler beim Anlegen des Nutzers.", "error");

  feedback("Registrierung erfolgreich. Warte auf Freischaltung durch einen Admin.", "success");
});

// === Login ===
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Anmeldung läuft …");
  const nickname = sanitizeNickname(e.target.nickname.value);
  const password = e.target.password.value;
  const email = makeFakeEmail(nickname);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return feedback("Fehler: " + error.message, "error");

  const { data: profile } = await supabase.from("profiles").select("role, approved").eq("id", data.user.id).maybeSingle();
  if (!profile) return feedback("Profil nicht gefunden.", "error");

  if (!profile.approved) {
    await supabase.auth.signOut();
    return feedback("Noch nicht freigeschaltet. Bitte warte auf Admin.", "error");
  }

  feedback("Willkommen an Bord!", "success");
  setTimeout(() => (window.location.href = "dashboard.html"), 800);
});