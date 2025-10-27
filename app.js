// === Supabase config: BITTE ERSETZEN ===
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Helpers ---
const $ = (s) => document.querySelector(s);
const feedback = (msg, kind = "") => {
  const el = $("#feedback");
  el.textContent = msg;
  el.className = `feedback ${kind}`.trim();
};

// --- Tab switching ---
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

// --- Utility: sanitize nickname to local-part (lowercase, keep a-z0-9._-)
function sanitizeNickname(nick) {
  return String(nick || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")           // spaces -> underscore
    .replace(/[^a-z0-9._-]/g, "")   // remove invalid chars
    .slice(0, 64);                  // reasonable length limit
}

// --- Build hidden fake email from nickname
function makeFakeEmail(nick) {
  const local = sanitizeNickname(nick) || ("user" + Math.floor(Math.random()*10000));
  return `${local}@bullfrog.fake`;
}

// --- LOGIN (nickname + password) ---
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Anmeldung wird durchgeführt …");

  const nickname = e.target.nickname.value;
  const password = e.target.password.value;
  const email = makeFakeEmail(nickname);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      feedback("Anmeldung fehlgeschlagen: " + error.message, "error");
      return;
    }
    feedback("Willkommen an Bord, " + (sanitizeNickname(nickname) || "") + "!", "success");
    // Redirect zum Dashboard
    setTimeout(() => (window.location.href = "dashboard.html"), 600);
  } catch (err) {
    feedback("Fehler: " + err.message, "error");
  }
});

// --- REGISTRATION (nickname + password + confirm) ---
$("#register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback("Registrierung läuft …");

  const nicknameRaw = e.target.nickname.value;
  const password = e.target.password.value;
  const confirm = e.target.password_confirm.value;
  const nickname = sanitizeNickname(nicknameRaw);

  if (!nickname) {
    feedback("Ungültiger Nickname.", "error");
    return;
  }
  if (password !== confirm) {
    feedback("Passwörter stimmen nicht überein.", "error");
    return;
  }
  if (password.length < 8) {
    feedback("Passwort zu kurz (mind. 8 Zeichen).", "error");
    return;
  }

  const email = makeFakeEmail(nickname);

  try {
    // Sign up: set nickname as user metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
        // emailRedirectTo: window.location.origin + "/welcome.html", // optional
      }
    });

    if (error) {
      // duplicate email / other auth error
      feedback("Registrierung fehlgeschlagen: " + error.message, "error");
      return;
    }

    // Supabase kann so konfiguriert sein, dass aktivierungs-mail erforderlich ist.
    if (data.user && !data.session) {
      feedback("Fast fertig! Bestätige ggf. deine E-Mail (systemintern). Nickname gespeichert.", "success");
    } else {
      feedback("Registrierung erfolgreich! Nickname gespeichert.", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 800);
    }
  } catch (err) {
    feedback("Fehler: " + err.message, "error");
  }
});