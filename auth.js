// auth.js
import { supabase } from './supabase.js';

console.log("✅ auth.js loaded and active");

// Login & Registration forms
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

console.log("Login form found:", !!loginForm, "Register form found:", !!registerForm);

// Registrierung
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log("📦 Starting registration...");

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const email = `${username}@bullfrog.fake`;

  console.log("→ User:", username, "| Email:", email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });

  if (error) {
    console.error("❌ Registration failed:", error.message);
    alert(error.message);
  } else {
    console.log("✅ Registration success:", data);
    alert('Registrierung erfolgreich – bitte auf Freischaltung warten.');
  }
});

// Login
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log("🔐 Starting login...");

  const username = document.getElementById('loginName').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const email = `${username}@bullfrog.fake`;

  console.log("→ Login attempt:", email);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("❌ Login error:", error.message);
    alert(error.message);
  } else {
    console.log("✅ Login success:", data);
    window.location.href = "dashboard.html";
  }
});