import { supabase } from "./supabase.js";

// ⚓ Initiale Prüfung & Daten laden
document.addEventListener("DOMContentLoaded", async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    window.location.href = "index.html";
    return;
  }

  const user = data.session.user;
  const { data: member } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .maybeSingle();

    if (mErr || !member || member.role !== "admin") {
    document.body.innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ Kein Zugriff</h1>
        <p>Nur Administratoren dürfen CSV-Daten verwalten.</p>
        <button onclick="location.href='dashboard.html'" class="btn-back">Zurück</button>
  }

  // Userinfos anzeigen
  document.getElementById("userName").textContent = member.username;
  document.getElementById("userRole").textContent = member.role;

  // Mitglieder laden
  await loadMembers();
});

// ⚓ Mitgliederliste laden
export async function loadMembers() {
  const container = document.getElementById("membersTable");
  container.innerHTML = "<p>Lade Mitglieder...</p>";

  const { data, error } = await supabase
    .from("members")
    .select("id, username, role, status, deleted_at, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    container.innerHTML = `<p>Fehler beim Laden: ${error.message}</p>`;
    return;
  }

  const session = (await supabase.auth.getSession()).data.session;
  const selfId = session.user.id;
  const founderId = "0d34739e-1719-4f19-b89d-25ffb8ea3bd3"; // Gründer-ID festgelegt

  const rows = data
    .map((m) => {
      const deleted = m.deleted_at !== null;
      const isAdmin = m.role === "admin";
      const isSelf = m.id === selfId;
      const isFounder = m.id === founderId;
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
                ? `<span style="color:#777;">—</span>`
                : `
              <button class="btn-action" data-action="activate" data-id="${m.id}">Aktivieren</button>
              <button class="btn-action" data-action="block" data-id="${m.id}">Blockieren</button>
              <button class="btn-action" data-action="role" data-id="${m.id}">
                ${isAdmin ? "Zu Member" : "Zu Admin"}
              </button>
              <button class="btn-action delete" data-action="delete" data-id="${m.id}">Löschen</button>
              `
            }
          </td>
        </tr>`;
    })
    .join("");

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
      await loadMembers();
    })
  );
}

// ⚓ Aktionen für Mitglieder (Status/Rolle/Delete)
async function handleAction(id, action) {
  let update = {};

  switch (action) {
    case "activate":
      update = { status: "active" };
      break;
    case "block":
      update = { status: "blocked" };
      break;
    case "role":
      const { data: current } = await supabase
        .from("members")
        .select("role")
        .eq("id", id)
        .single();
      update = { role: current.role === "admin" ? "member" : "admin" };
      break;
    case "delete":
      if (!confirm("Benutzer wirklich entfernen? (Soft Delete)")) return;
      update = { deleted_at: new Date().toISOString() };
      break;
  }

  const { error } = await supabase.from("members").update(update).eq("id", id);
  if (error) alert("Fehler: " + error.message);
}

// ⚓ Logout
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});