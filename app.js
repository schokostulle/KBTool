// ======================================
// Supabase-Konfiguration
// ======================================

const SUPABASE_URL = "https://xgdybrinpypeppdswheb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZHlicmlucHlwZXBwZHN3aGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODEwOTUsImV4cCI6MjA3NjU1NzA5NX0.cphqzda66AqJEXzZ0c49PZFM8bZ_eJwjHaiyvIP_sPo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hilfsfunktionen
const $ = (s) => document.querySelector(s);
function logout() {
  localStorage.clear();
  supabase.auth.signOut();
  window.location.href = "index.html";
}

// Menü dynamisch nach Rolle erstellen
function buildMenu() {
  const role = localStorage.getItem("role");
  const menu = $("#menu");
  if (!menu) return;

  const base = [
    { name: "🧭 Dashboard", link: "dashboard.html" },
  ];

  const memberTools = [
    { name: "📜 Reservierungen", link: "reservierungen.html" },
    { name: "⚔️ Kriegsberichte", link: "kriegsberichte.html" },
    { name: "🚢 Flottenstärke", link: "flotten.html" },
    { name: "🗺️ Karte", link: "karte.html" },
    { name: "🛡️ Angriff & Verteidigung", link: "angriffe.html" },
    { name: "📚 KB-Datenbank", link: "kb.html" },
  ];

  const adminTools = [
    { name: "🤝 Diplomatie", link: "diplomatie.html" },
    { name: "📂 CSV-Verwaltung", link: "csv.html" },
    { name: "👥 Mitgliederverwaltung", link: "mitglieder.html" },
  ];

  let links = [...base];

  if (role === "member" || role === "admin") links.push(...memberTools);
  if (role === "admin") links.push(...adminTools);

  links.push({ name: "🏕️ Logout", link: "#", action: logout });

  menu.innerHTML = links.map(l => 
    `<a href="${l.link}" ${location.pathname.endsWith(l.link) ? 'class="active"' : ''} ${l.action ? 'onclick="'+l.action.name+'()"' : ''}>${l.name}</a>`
  ).join("");
}

// Zugriffsschutz (Weiterleitung bei falscher Rolle)
function protectPage(required = ["member", "admin"]) {
  const role = localStorage.getItem("role");
  const nick = localStorage.getItem("nickname");
  if (!nick || !role || !required.includes(role)) {
    alert("Kein Zugriff. Bitte anmelden.");
    window.location.href = "index.html";
  }
  if ($("#welcome")) $("#welcome").textContent = `${nick} (${role})`;
}

// Automatisch beim Seitenstart Menü aufbauen
document.addEventListener("DOMContentLoaded", buildMenu);