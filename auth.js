import { supabase } from './supabaseClient.js';

// Registrierung
export async function registerUser(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);

  await supabase.from('user_roles').insert([{ user_id: data.user.id }]);
  alert("Registrierung erfolgreich! Warte auf Freischaltung durch Admin.");
}

// Login
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();

  if (roleData.role === 'anwaerter') {
    window.location.href = 'pending.html';
  } else {
    localStorage.setItem('role', roleData.role);
    window.location.href = 'dashboard.html';
  }
}