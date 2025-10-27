const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (sel) => document.querySelector(sel);
const feedback = (msg, type = "") => {
  const el = $("#feedback");
  el.textContent = msg;
  el.className = `feedback ${type}`;
};

// Tabs
$("#tab-login").addEventListener("click", () => switchTab("login"));
$("#tab-register").addEventListener("click", () => switchTab("register"));

function switchTab(tab) {
  const isLogin = tab === "login";
  $("#tab-login").classList.toggle("active", isLogin);
  $("#tab-register").classList.toggle("active", !isLogin);
  $("#panel-login").hidden = !isLogin;
  $("#panel-register").hidden = isLogin;
  feedback("");
}

// Login
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Maste werden gesetzt …");
  const email = e.target.email.value.trim();
  const password = e.target.password.value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return feedback("Anmeldung fehlgeschlagen: " + error.message, "error");

  feedback("Willkommen an Bord!", "success");
  setTimeout(() => (window.location.href = "dashboard.html"), 1000);
});

// Registrierung
$("#register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Anheuern …");

  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  const confirm = e.target.password_confirm.value;

  if (password !== confirm) return feedback("Passwörter stimmen nicht überein.", "error");
  if (password.length < 8) return feedback("Passwort zu kurz (mind. 8 Zeichen).", "error");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return feedback("Fehler: " + error.message, "error");

  if (data.user && !data.session) feedback("Bestätige deine E-Mail, um an Bord zu kommen.", "success");
  else feedback("Registrierung erfolgreich!", "success");
});