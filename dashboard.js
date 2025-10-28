import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const dashboardContent = document.getElementById("dashboardContent");
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn?.addEventListener("click", logout);

  // === Benutzer prüfen ===
  const user = await getCurrentUser();

  // Kein User -> zurück zum Login
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Mitgliedsdaten laden
  const { data: member, error } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .single();

  // Fehler oder kein Datensatz -> Logout
  if (error || !member) {
    console.error("Fehler beim Laden der Mitgliedsdaten:", error?.message);
    await logout();
    return;
  }

  // Benutzerdaten eintragen
  document.getElementById("userName").textContent = member.username;
  document.getElementById("userRole").textContent = member.role;

  // Admin-Links ausblenden
  if (member.role !== "admin") {
    document.querySelectorAll("[data-admin]").forEach(link => (link.style.display = "none"));
  }

  // Zugriff prüfen
  if (member.status !== "active" && member.role !== "admin") {
    dashboardContent.innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ Kein Zugriff</h1>
        <p>Dein Konto ist noch nicht freigeschaltet.<br>
        Bitte warte auf Freischaltung durch einen Admin.</p>
      </main>`;
  } else {
    // Nur wenn aktiv oder Admin → Dashboard zeigen
    await loadNews(member);
    if (member.role === "admin") enableAdminNews(member);
  }

  // === Jetzt Ladebildschirm ausblenden ===
  loadingScreen.style.display = "none";
  dashboardContent.style.display = "block";
});

// ===========================================================
// ⚓ News laden
// ===========================================================
async function loadNews(member) {
  const list = document.getElementById("newsList");
  list.textContent = "Lade Ankündigungen...";

  const { data, error } = await supabase
    .from("news")
    .select("id, title, content, author_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    list.textContent = "Fehler beim Laden der Ankündigungen.";
    console.error(error.message);
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<p>Keine Ankündigungen vorhanden.</p>";
    return;
  }

  list.innerHTML = data
    .map(
      (n) => `
      <div class="news-item">
        <h3>${n.title}</h3>
        <p>${n.content}</p>
        <small>von ${n.author_name || "unbekannt"} – 
          ${new Date(n.created_at).toLocaleString()}</small>
        ${
          member.role === "admin"
            ? `<br><button data-id="${n.id}" class="delete-btn">Löschen</button>`
            : ""
        }
      </div>`
    )
    .join("");

  if (member.role === "admin") {
    document.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (!confirm("Diese Ankündigung wirklich löschen?")) return;
        const { error: delError } = await supabase.from("news").delete().eq("id", id);
        if (delError) alert("Fehler beim Löschen der Ankündigung.");
        else await loadNews(member);
      })
    );
  }
}

// ===========================================================
// ⚓ Admin News Formular aktivieren
// ===========================================================
function enableAdminNews(member) {
  const formSection = document.getElementById("adminNewsForm");
  formSection?.classList.remove("hidden");

  const newsForm = document.getElementById("newsForm");
  newsForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    if (!title || !content) return alert("Bitte Titel und Inhalt angeben.");

    const { error } = await supabase.from("news").insert({
      title,
      content,
      author_name: member.username,
    });

    if (error) alert("Fehler beim Erstellen der Ankündigung.");
    else {
      newsForm.reset();
      await loadNews(member);
    }
  });
}