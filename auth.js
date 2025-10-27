import { supabase } from './supabase.js';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Registrierung
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const email = `${username}@bullfrog.fake`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  if (error) return alert(error.message);
  alert('Registrierung erfolgreich – bitte auf Freischaltung warten.');
});

// Login
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginName').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const email = `${username}@bullfrog.fake`;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  window.location.href = "dashboard.html";
});