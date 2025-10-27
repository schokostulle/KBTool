// ======================================
// Supabase-Konfiguration
// ======================================

const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (s) => document.querySelector(s);
const msg = (m, c="") => { const el=$("#msg"); el.textContent=m; el.className=c; };

// 🔹 Registrierung
async function register(nick, pass) {
  const email = `${nick}@bullfrog.fake`;
  const { data, error } = await supabase.auth.signUp({
    email, password: pass, options: { data: { nickname: nick } }
  });
  if (error) throw new Error(error.message);
  msg("Registriert. Bitte warte auf Freischaltung.","ok");
}

// 🔹 Login
async function login(nick, pass) {
  const email = `${nick}@bullfrog.fake`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error(error.message);
  const user = data.user;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) throw new Error("Kein Profil gefunden.");
  if (!profile.approved) throw new Error("Noch nicht freigeschaltet.");
  localStorage.setItem("nickname", profile.nickname);
  localStorage.setItem("role", profile.role);
  msg("Willkommen "+profile.nickname,"ok");
  setTimeout(()=>location.href="dashboard.html",1000);
}

// 🔹 Logout
async function logout() {
  await supabase.auth.signOut();
  localStorage.clear();
  location.href="index.html";
}