import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loadingScreen = document.getElementById("loadingScreen");
  const pageContent = document.getElementById("pageContent");
  const logoutBtn = document.getElementById("logoutBtn");
  const tableArea = document.getElementById("memberTableArea");

  loadingScreen.style.display = "block";
  pageContent.style.display = "none";

  logoutBtn?.addEventListener("click", logout);

  // === Auth prüfen ===
  const user = await getCurrentUser();
  if (!user) {
    alert("❌ Keine aktive Sitzung. Bitte erneut anmelden.");
    window.location.href = "index.html";
    return;
  }

  const { data: member, error } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .single();

  if (error || !member) {
    alert("Fehler beim Laden deiner Daten.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userName").textContent = member.username;
  document.getElementById("userRole").textContent = member.role;

  // Adminpflicht
  if (member.role !== "admin") {
    pageContent.innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ Kein Zugriff</h1>
        <p>Nur Administratoren dürfen diese Seite aufrufen.</p>
      </main>`;
    loadingScreen.style.display = "none";
    pageContent.style.display = "block";
    return;
  }

  // Admin-Links sichtbar lassen
  loadingScreen.style.display = "none";
  pageContent.style.display = "block";

  // === Mitgliederliste laden ===
  await loadMembers(tableArea);
});

// ===========================================================
// ⚓ Mitglieder laden
// ===========================================================
async function loadMembers(container) {
  const { data, error } = await supabase
    .from("members")
    .select("id, username, role, status, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    container.innerHTML = `<p>❌ Fehler beim Laden der Mitglieder.</p>`;
    console.error(error.message);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<p>Keine Mitglieder gefunden.</p>`;
    return;
  }

  // Tabelle rendern
  const rows = data
    .map(
      (m) => `
        <tr>
          <td>${m.username}</td>
          <td>${m.role}</td>
          <td>${m.status}</td>
          <td>${new Date(m.created_at).toLocaleDateString()}</td>
        </tr>`
    )
    .join("");

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Benutzername</th>
          <th>Rolle</th>
          <th>Status</th>
          <th>Registriert am</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}