// =====================================================
// 🔧 Supabase Setup
// =====================================================
const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co"; // <-- anpassen!
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo"; // <-- anpassen!

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// 🧩 REGISTRIERUNG
// =====================================================
export async function registerUser(username, password) {
  try {
    // Prüfen, ob Benutzername schon existiert
    const { data: existing, error: checkErr } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (checkErr) throw checkErr;
    if (existing) {
      return { success: false, message: "Dieser Benutzername ist bereits vergeben." };
    }

    // Prüfen, ob es bereits einen Benutzer gibt → erster wird Admin
    const { count, error: countErr } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });
    if (countErr) throw countErr;

    const isFirstUser = count === 0;
    const role = isFirstUser ? "admin" : "member";
    const status = isFirstUser ? "active" : "pending";

    // Fake-Mail (Supabase Auth braucht E-Mail)
    const email = `${username}@bullfrog.fake`;

    // Auth-Account erstellen
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    // Benutzer in Tabelle eintragen
    const { error: insertErr } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        username,
        role,
        status,
      },
    ]);
    if (insertErr) throw insertErr;

    // Erfolgsmeldung
    if (isFirstUser) {
      return {
        success: true,
        message:
          "Registrierung erfolgreich. Du bist der erste Benutzer und wurdest als Admin angelegt.",
      };
    } else {
      return {
        success: true,
        message:
          "Registrierung erfolgreich. Ein Admin muss dich noch freischalten, bevor du dich einloggen kannst.",
      };
    }
  } catch (err) {
    console.error("Registrierungsfehler:", err.message);
    return { success: false, message: "Fehler bei der Registrierung: " + err.message };
  }
}

// =====================================================
// 🔐 LOGIN
// =====================================================
export async function loginUser(username, password) {
  try {
    const email = `${username}@bullfrog.fake`;

    // Login bei Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Benutzerprofil abrufen
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, username, role, status")
      .eq("username", username)
      .maybeSingle();

    if (userError) throw userError;
    if (!userData) {
      return { success: false, message: "Benutzername nicht gefunden." };
    }

    // Status prüfen
    if (userData.status === "pending") {
      await supabase.auth.signOut();
      return { success: false, message: "Dein Account wurde erstellt, ist aber noch nicht freigeschaltet." };
    }
    if (userData.status === "blocked") {
      await supabase.auth.signOut();
      return { success: false, message: "Dein Account ist derzeit gesperrt." };
    }

    // Erfolg → Daten lokal speichern
    localStorage.setItem("user_id", userData.id);
    localStorage.setItem("username", userData.username);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("status", userData.status);

    return { success: true, message: `Willkommen ${userData.username}!` };
  } catch (err) {
    console.error("Login-Fehler:", err.message);
    return { success: false, message: "Login fehlgeschlagen: " + err.message };
  }
}

// =====================================================
// 🚪 LOGOUT
// =====================================================
export async function logoutUser() {
  localStorage.clear();
  await supabase.auth.signOut();
}

// =====================================================
// 🧠 USER HELPER
// =====================================================
export function getCurrentUser() {
  return {
    id: localStorage.getItem("user_id"),
    username: localStorage.getItem("username"),
    role: localStorage.getItem("role"),
    status: localStorage.getItem("status"),
  };
}

// =====================================================
// 👥 MITGLIEDERVERWALTUNG (Admin)
// =====================================================
export async function listUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, role, status")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateUserStatus(id, newStatus) {
  const { error } = await supabase.from("users").update({ status: newStatus }).eq("id", id);
  if (error) throw error;
}

export async function changeUserRole(id, newRole) {
  const { error } = await supabase.from("users").update({ role: newRole }).eq("id", id);
  if (error) throw error;
}

export async function deleteUser(id) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
}