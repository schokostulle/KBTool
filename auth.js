import { supabase } from "./supabaseClient.js";

// Nickname → Fake-E-Mail erzeugen
function makeFakeEmail(nick) {
  return `${nick.toLowerCase()}@bullfrog.fake`;
}

// Registrierung
export async function registerUser(nick, pass1, pass2) {
  if (!nick || !pass1 || !pass2) {
    return alert("Bitte alle Felder ausfüllen.");
  }
  if (pass1 !== pass2) {
    return alert("Passwörter stimmen nicht überein!");
  }

  const email = makeFakeEmail(nick);

  // Prüfen, ob Nickname schon existiert
  const { data: existing } = await supabase
    .from("user_roles")
    .select("user_id")
    .ilike("user_id", email); // optional, falls du Nicknamen separat speicherst

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: pass1,
  });

  if (error) return alert(error.message);

  // Rolle setzen
  await supabase.from("user_roles").insert([{ user_id: data.user.id }]);
  alert("Registrierung erfolgreich! Warte auf Freischaltung durch Admin.");
}

// Login
export async function loginUser(nick, password) {
  if (!nick || !password) {
    return alert("Bitte Nickname und Passwort eingeben.");
  }

  const email = makeFakeEmail(nick);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) return alert("Login fehlgeschlagen: " + error.message);

  // Rolle abrufen
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  if (roleError) {
    console.error(roleError);
    return alert("Fehler beim Abrufen der Rolle.");
  }

  const role = roleData.role;

  if (role === "anwaerter") {
    window.location.href = "pending.html";
  } else {
    localStorage.setItem("role", role);
    window.location.href = "dashboard.html";
  }
}