// ======================================
// Supabase-Konfiguration
// ======================================
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================================
// Hilfsfunktionen
// ======================================
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

// ======================================
// Tab-Steuerung
// ======================================
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

// ======================================
// REGISTRIERUNG
// ======================================
$("#register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Registrierung läuft …");

  const nickname = sanitizeNickname(e.target.nickname.value);
  const password = e.target.password.value;
  const confirm = e.target.password_confirm.value;

  if (password !== confirm) return feedback("Passwörter stimmen nicht überein.", "error");
  if (nickname.length < 3) return feedback("Nickname zu kurz.", "error");

  // Prüfen, ob Nickname bereits vergeben
  const { data: existing, error: checkError } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("nickname", nickname)
    .maybeSingle();
  if (checkError) return feedback("Fehler bei Namensprüfung: " + checkError.message, "error");
  if (existing) return feedback("Nickname bereits vergeben.", "error");

  // Registrieren (E-Mail = Fake-Adresse)
  const email = makeFakeEmail(nickname);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });
  if (error) return feedback("Fehler bei Registrierung: " + error.message, "error");

  feedback(
    "Registrierung erfolgreich! Bitte warte, bis du vom Admin freigeschaltet wirst.",
    "success"
  );
});

// ======================================
// LOGIN
// ======================================
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Anmeldung läuft …");

  const nickname = sanitizeNickname(e.target.nickname.value);
  const password = e.target.password.value;
  const email = makeFakeEmail(nickname);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return feedback("Fehler: " + error.message, "error");

  const user = data.user;
  if (!user) return feedback("Fehler: Kein Benutzerobjekt erhalten.", "error");

  // Profil abrufen
  let { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role, approved, nickname")
    .eq("id", user.id)
    .maybeSingle();

  // Wenn kein Profil existiert (sollte nicht vorkommen, aber zur Sicherheit)
  if (!profile) {
    console.warn("Kein Profil gefunden, lege eines nachträglich an …");
    const fallbackNick = nickname || email.split("@")[0];
    const { error: insertErr } = await supabase.from("profiles").insert({
      id: user.id,
      nickname: fallbackNick,
      role: "anwärter",
      approved: false,
    });
    if (insertErr) {
      feedback("Profil konnte nicht erstellt werden: " + insertErr.message, "error");
      await supabase.auth.signOut();
      return;
    }
    feedback("Profil wurde neu angelegt. Bitte erneut anmelden.", "success");
    await supabase.auth.signOut();
    return;
  }

  // Anwärter dürfen nicht ins Dashboard
  if (!profile.approved) {
    await supabase.auth.signOut();
    return feedback(
      "Du bist noch nicht freigeschaltet. Bitte warte auf die Aktivierung durch einen Admin.",
      "error"
    );
  }

  feedback("Willkommen zurück, " + profile.nickname + "!", "success");
  setTimeout(() => (window.location.href = "dashboard.html"), 800);
});