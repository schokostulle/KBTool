import { supabase } from "./supabase.js";

// ⚓ Starte nach DOM-Load
document.addEventListener("DOMContentLoaded", async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.user;

  // Hole Benutzerinformationen
  const { data: currentUser, error } = await supabase
    .from("members")
    .select("id, username, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Fehler beim Laden des aktuellen Benutzers:", error);
    return;
  }

  // Setze Anzeige im Header
  document.getElementById("userName").textContent = currentUser.username;
  document.getElementById("userRole").textContent = currentUser.role;

  // Zeige Menüeinträge für Admins
  if (currentUser.role === "admin") {
    document.querySelectorAll("[data-admin]").forEach(el => (el.style.display = "block"));
  } else {
    // keine Fehlermeldung, einfach Dashboard anzeigen
    window.location.href = "dashboard.html";
    return;
  }

  // Lade Mitgliederliste
  await loadMembers(currentUser);
});

// ⚓ Lade Mitglieder
async function loadMembers(currentUser) {
  const container = document.getElementById("membersTable");
  container.innerHTML = "<p>Lade Mitglieder...</p>";

  const { data: members, error } = await supabase
    .from("members")
    .select("id, username, role, status, deleted_at, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    container.innerHTML = `<p>Fehler beim Laden: ${error.message}</p>`;
    return;
  }

  const rows = members
    .map((m) => {
      const deleted = m.deleted_at !== null;
      const isSelf = m.id === currentUser.id;
      const isAdmin = m.role === "admin";
      const disabled = deleted || isSelf ? "disabled" : "";

      return `
        <tr ${deleted ? 'style="opacity:0.5;"' : ""}>
          <td>${m.username}${deleted ? " (gelöscht)" : ""}</td>
          <td>${m.role}</td>
          <td>${m.status}</td>
          <td>${new Date(m.created_at).toLocaleDateString()}</td>
          <td>
            ${
              deleted
                ? "-"
                : `
              <button class="btn-action" data-action="activate" data-id="${m.id}" ${disabled}>Aktivieren</button>
              <button class="btn-action" data-action="block" data-id="${m.id}" ${disabled}>Blockieren</button>
              <button class="btn-action" data-action="role" data-id="${m.id}" ${disabled}>
                ${isAdmin ? "Zu Member" : "Zu Admin"}
              </button>
              <button class="btn-action delete" data-action="delete" data-id="${m.id}" ${disabled}>Löschen</button>
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

  // Aktionen anhängen
  document.querySelectorAll(".btn-action").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const action = e.target.dataset.action;
      await handleAction(id, action);
      await loadMembers(currentUser); // neu laden
    })
  );
}

// ⚓ Aktionen für Benutzer
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
      const { data: user } = await supabase
        .from("members")
        .select("role")
        .eq("id", id)
        .single();
      update = { role: user.role === "admin" ? "member" : "admin" };
      break;
    case "delete":
      if (!confirm("Benutzer wirklich entfernen (Soft Delete)?")) return;
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