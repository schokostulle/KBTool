import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Elemente vorbereiten
  const loadingScreen = document.getElementById("loadingScreen");
  const dashboardContent = document.getElementById("dashboardContent");
  const logoutBtn = document.getElementById("logoutBtn");

  // Start: Ladebildschirm aktivieren
  if (loadingScreen) loadingScreen.style.display = "block";
  if (dashboardContent) dashboardContent.style.display = "none";

  // Logout-Button aktivieren
  logoutBtn?.addEventListener("click", logout);

  // === Sitzung prüfen ===
  const user = await getCurrentUser();
  if (!user) {
    alert("❌ Keine aktive Sitzung. Bitte erneut anmelden.");
    window.location.href = "index.html";
    return;
  }

  try {
    // Mitgliedsdaten abrufen
    const { data: member, error } = await supabase
      .from("members")
      .select("username, role, status")
      .eq("id", user.id)
      .single();

    if (error || !member) {
      console.error("❌ Fehler beim Laden der Mitgliedsdaten:", error?.message);
      alert("Fehler beim Laden deiner Daten.");
      window.location.href = "index.html";
      return;
    }

    // Benutzerinfo anzeigen
    document.getElementById("userName").textContent = member.username;
    document.getElementById("userRole").textContent = member.role;

    // Zugriff prüfen
    if (member.status !== "active" && member.role !== "admin") {
      if (dashboardContent) {
        dashboardContent.innerHTML = `
          <main style="text-align:center; padding:3rem;">
            <h1>⚓ Kein Zugriff</h1>
            <p>Dein Konto ist noch nicht freigeschaltet.<br>
            Bitte warte auf Freischaltung durch einen Admin.</p>
          </main>`;
      }
      loadingScreen.style.display = "none";
      dashboardContent.style.display = "block";
      return;
    }

    // === News laden ===
    await loadNews(member);

    // === Admin: Formular aktivieren ===
    if (member.role === "admin") {
      const formSection = document.getElementById("adminNewsForm");
      formSection?.classList.remove("hidden");

      const newsForm = document.getElementById("newsForm");
      newsForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("title").value.trim();
        const content = document.getElementById("content").value.trim();
        if (!title || !content) return alert("Bitte Titel und Inhalt angeben.");

        // Insert in Tabelle "news"
        const { error: insertError } = await supabase.from("news").insert({
          title,
          content,
          author_name: member.username,
        });

        if (insertError) {
          console.error("❌ Fehler beim Posten:", insertError.message);
          alert("Fehler beim Erstellen der Ankündigung.");
        } else {
          newsForm.reset();
          await loadNews(member);
        }
      });
    }

    // === Nach erfolgreichem Laden Dashboard anzeigen ===
    loadingScreen.style.display = "none";
    dashboardContent.style.display = "block";
  } catch (err) {
    console.error("❌ Dashboard-Fehler:", err);
    alert("Fehler beim Laden des Dashboards.");
    loadingScreen.style.display = "none";
    dashboardContent.style.display = "block";
  }
});

// === Funktion: News laden ===
async function loadNews(member) {
  const list = document.getElementById("newsList");
  list.textContent = "Lade Ankündigungen...";

  const { data, error } = await supabase
    .from("news")
    .select("id, title, content, author_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Fehler beim Laden der News:", error.message);
    list.textContent = "Fehler beim Laden der Ankündigungen.";
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

  // === Admin: Löschen aktivieren ===
  if (member.role === "admin") {
    document.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (!confirm("Diese Ankündigung wirklich löschen?")) return;

        const { error: delError } = await supabase
          .from("news")
          .delete()
          .eq("id", id);

        if (delError) {
          console.error("❌ Fehler beim Löschen:", delError.message);
          alert("Fehler beim Löschen der Ankündigung.");
        } else {
          await loadNews(member);
        }
      })
    );
  }
}