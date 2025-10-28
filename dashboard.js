import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", logout);

  // === User prüfen ===
  const user = await getCurrentUser();
  if (!user) {
    alert("❌ Keine aktive Sitzung. Bitte erneut anmelden.");
    window.location.href = "index.html";
    return;
  }

  // Mitgliedsdaten abrufen
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

  if (member.status !== "active" && member.role !== "admin") {
    document.querySelector("main").innerHTML = `
      <div class="text-center" style="margin-top:5rem;">
        <h2>⚓ Kein Zugriff</h2>
        <p>Dein Konto ist noch nicht freigeschaltet.<br>
        Bitte warte auf Freischaltung durch einen Admin.</p>
      </div>`;
    return;
  }

  // === News laden ===
  await loadNews(member);

  // === Wenn Admin, Formular anzeigen ===
  if (member.role === "admin") {
    const formSection = document.getElementById("adminNewsForm");
    formSection.classList.remove("hidden");

    const newsForm = document.getElementById("newsForm");
    newsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("title").value.trim();
      const content = document.getElementById("content").value.trim();
      if (!title || !content) return alert("Bitte Titel und Inhalt angeben.");

      const { error: insertError } = await supabase.from("news").insert({
        title,
        content,
        author_name: member.username,
      });

      if (insertError) {
        alert("❌ Fehler beim Posten.");
        console.error(insertError.message);
      } else {
        newsForm.reset();
        await loadNews(member);
      }
    });
  }
});

// === News laden ===
async function loadNews(member) {
  const { data, error } = await supabase
    .from("news")
    .select("id, title, content, author_name, created_at")
    .order("created_at", { ascending: false });

  const list = document.getElementById("newsList");

  if (error) {
    list.textContent = "Fehler beim Laden der Ankündigungen.";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<p>Keine Ankündigungen vorhanden.</p>";
    return;
  }

  list.innerHTML = data
    .map((n) => `
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
      </div>
    `)
    .join("");

  // Löschen nur für Admins
  if (member.role === "admin") {
    document.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (!confirm("Diese Ankündigung wirklich löschen?")) return;
        const { error: delError } = await supabase
          .from("news")
          .delete()
          .eq("id", id);
        if (delError) alert("❌ Fehler beim Löschen.");
        else await loadNews(member);
      })
    );
  }
}