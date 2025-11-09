// === AUTHENTIFIZIERUNG MIT SUPABASE (benutzername@bullfrog.fake) ===

// Event Listener
document.getElementById("loginBtn").addEventListener("click", loginUser);
document.getElementById("registerLink").addEventListener("click", showRegister);
document.getElementById("backToLogin").addEventListener("click", showLogin);
document.getElementById("registerBtn").addEventListener("click", registerUser);

function showRegister() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("register-container").style.display = "block";
}

function showLogin() {
  document.getElementById("login-container").style.display = "block";
  document.getElementById("register-container").style.display = "none";
}

// === Registrierung ===
async function registerUser() {
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const role = document.getElementById("reg-role").value;

  if (!username || !password) {
    showStatus("Bitte alle Felder ausfüllen!", "warning");
    return;
  }

  // Eindeutige Fake-Mail
  const fakeEmail = `${username.toLowerCase()}@bullfrog.fake`;

  // Registrierung über Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: fakeEmail,
    password,
    options: { data: { username, role } }
  });

  if (error) {
    console.error(error);
    showStatus("Fehler bei der Registrierung: " + error.message, "error");
    return;
  }

  const { user } = data;
  if (!user) {
    showStatus("Registrierung fehlgeschlagen (keine Benutzer-ID erhalten).", "error");
    return;
  }

  // Profil in der Tabelle 'profiles' speichern
  const { error: profileError } = await supabase.from("profiles").insert([
    { id: user.id, username, role, status: "active", deleted: false }
  ]);

  if (profileError) {
    console.error(profileError);
    showStatus("Fehler beim Speichern des Profils: " + profileError.message, "error");
    return;
  }

  showStatus("Registrierung erfolgreich! Du kannst dich jetzt anmelden.", "success");
  showLogin();
}

// === Login ===
async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    showStatus("Bitte Benutzername und Passwort eingeben!", "warning");
    return;
  }

  const fakeEmail = `${username.toLowerCase()}@bullfrog.fake`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password
  });

  if (error) {
    showStatus("Login fehlgeschlagen: " + error.message, "error");
    return;
  }

  const sessionUser = data.user;
  if (!sessionUser) {
    showStatus("Fehler beim Login (keine Session erhalten).", "error");
    return;
  }

  // Profil abrufen
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, role, status, deleted")
    .eq("id", sessionUser.id)
    .single();

  if (profileError || !profile) {
    console.error(profileError);
    showStatus("Profil konnte nicht geladen werden.", "error");
    return;
  }

  if (profile.deleted) {
    showStatus("Dieses Konto wurde gelöscht.", "error");
    await supabase.auth.signOut();
    return;
  }

  if (profile.status === "blocked") {
    showStatus("Dieses Konto ist blockiert.", "error");
    await supabase.auth.signOut();
    return;
  }

  // Benutzer lokal speichern (schneller Zugriff)
  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      id: sessionUser.id,
      username: profile.username,
      role: profile.role
    })
  );

  showStatus("Login erfolgreich! Weiterleitung zum Dashboard...", "success");
  setTimeout(() => (window.location.href = "dashboard.html"), 1000);
}

// === Auto-Redirect, wenn bereits eingeloggt ===
window.addEventListener("load", async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    window.location.href = "dashboard.html";
  }
});