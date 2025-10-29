import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const tableArea = document.getElementById("memberTableArea");

  logoutBtn?.addEventListener('click', () => logout());

  // === Auth prüfen ===
  const user = await getCurrentUser();
  if (!user) {
    alert("❌ Keine aktive Sitzung. Bitte erneut anmelden.");
    window.location.href = "index.html";
    return;
  }

  const { data: currentUser, error } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .single();

  if (error || !currentUser) {
    alert("Fehler beim Laden deiner Daten.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userName").textContent = currentUser.username;
  document.getElementById("userRole").textContent = currentUser.role;

  // Adminpflicht
//  if (currentUser.role !== "admin") {
 //   document.querySelector("main").innerHTML = `
//    <main style="text-align:center; padding:3rem;">
 //       <h1>⚓ Kein Zugriff</h1>
//       <p>Nur Administratoren dürfen diese Seite aufrufen.</p>

// Verstecke alle Admin-Bereiche für Member
if (role !== "admin") {
  document.querySelectorAll("[data-admin]").forEach(el => el.style.display = "none");
}
      </main>`;
    return;
  }

  // === Mitgliederliste laden ===
  await loadMembers(tableArea);
});

// ===========================================================
// ⚓ Mitgliederliste laden
// ===========================================================
async function loadMembers(container) {
  const { data, error } = await supabase
    .from("members")
    .select("id, username, role, status, deleted_at, created_at")
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

// Tabellenzeilen mit Buttons
const rows = data
  .map((m) => {
    const deleted = m.deleted_at !== null;
    const isActive = m.status === "active";
    const isAdmin = m.role === "admin";
    const isSelf = m.id === session.user.id;
    const isFounder = m.id === "0d34739e-1719-4f19-b89d-25ffb8ea3bd3"; // Gründer-ID (Beispiel: Red)

    // Kein Bearbeiten/Löschen bei Selbst oder Gründer
    const canModify = !isSelf && !isFounder && !deleted;

    return `
      <tr ${deleted ? 'style="opacity:0.5;"' : ""}>
        <td>${m.username}${deleted ? " (gelöscht)" : ""}</td>
        <td>${m.role}</td>
        <td>${m.status}</td>
        <td>${new Date(m.created_at).toLocaleDateString()}</td>
        <td>
          ${
            !canModify
              ? `<span style="color:#888;">—</span>`
              : `
              <button class="btn-action" data-action="activate" data-id="${m.id}">
                Aktivieren
              </button>
              <button class="btn-action" data-action="block" data-id="${m.id}">
                Blockieren
              </button>
              <button class="btn-action" data-action="role" data-id="${m.id}">
                ${isAdmin ? "Zu Member" : "Zu Admin"}
              </button>
              <button class="btn-action delete" data-action="delete" data-id="${m.id}">
                Löschen
              </button>
              `
          }
        </td>
      </tr>`;
  })
  .join("");

// Tabelle rendern
container.innerHTML = `
  <table class="data-table">
    <thead>
      <tr>
        <th>Benutzername</th>
        <th>Rolle</th>
        <th>Status</th>
        <th>Registriert</th>
        <th>Aktionen</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;

// Eventlistener für Buttons
document.querySelectorAll(".btn-action").forEach((btn) =>
  btn.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    const action = e.target.dataset.action;
    await handleAction(id, action);
    await loadMembers(container); // Tabelle neu laden
  })
);

// ===========================================================
// ⚙️ Aktionen: Aktivieren / Blockieren / Rolle ändern / Löschen
// ===========================================================
async function handleAction(id, action) {
  let updateData = {};

  switch (action) {
    case "activate":
      updateData = { status: "active" };
      break;
    case "block":
      updateData = { status: "blocked" };
      break;
    case "role":
      // aktuelle Rolle abfragen
      const { data: member } = await supabase
        .from("members")
        .select("role")
        .eq("id", id)
        .single();
      updateData = { role: member.role === "admin" ? "member" : "admin" };
      break;
    case "delete":
      if (!confirm("Diesen Benutzer wirklich löschen (Soft-Delete)?")) return;
      updateData = { deleted_at: new Date().toISOString() };
      break;
    default:
      return;
  }

  const { error } = await supabase.from("members").update(updateData).eq("id", id);
  if (error) {
    console.error("❌ Fehler bei Aktion:", error.message);
    alert("Aktion konnte nicht ausgeführt werden.");
  }
}