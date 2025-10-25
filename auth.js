import { supabase } from "./supabaseClient.js";

export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);

  // Anwärterrolle setzen
  await supabase.from("user_roles").insert([{ user_id: data.user.id }]);
  alert("Registrierung erfolgreich! Warte auf Freischaltung durch Admin.");
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  const role = roleData?.role || "anwaerter";

  if (role === "anwaerter") {
    window.location.href = "pending.html";
  } else if (role === "admin" || role === "member") {
    localStorage.setItem("role", role);
    window.location.href = "dashboard.html";
  }
}