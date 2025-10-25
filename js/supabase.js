// js/supabase.js

// --- Supabase Verbindung konfigurieren ---
// Diese Werte findest du in deinem Supabase Projekt unter
// Settings → API → Project URL & anon public key

const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

// Supabase-Client erstellen (globale Variable)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Authentifizierungsfunktionen ---

// Benutzer registrieren (mit Fake-Mail-Domain)
async function registerUser(username, password) {
  const email = `${username}@bullfrog.fake`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: 'applicant' } // Anwärter als Standardrolle
    }
  });

  if (error) {
    console.error('Registrierungsfehler:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

// Benutzer anmelden
async function loginUser(username, password) {
  const email = `${username}@bullfrog.fake`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Loginfehler:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

// Benutzer abmelden
async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Logoutfehler:', error.message);
}

// Aktuell eingeloggten Benutzer abrufen
async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// Benutzerrolle abrufen (aus user_metadata)
async function getUserRole() {
  const user = await getCurrentUser();
  return user?.user_metadata?.role || 'guest';
}

// Benutzerrolle ändern (nur Admin)
async function setUserRole(userId, newRole) {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole }
  });

  if (error) {
    console.error('Rollenänderungsfehler:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

// --- Export für andere JS-Dateien ---
export {
  supabase,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUserRole,
  setUserRole
};