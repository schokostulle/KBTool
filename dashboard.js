import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const user = await getCurrentUser();
  if (!user) {
    alert("❌ Keine aktive Sitzung. Bitte melde dich erneut an.");
    window.location.href = "index.html";
    return;
  }

  // Member-Daten laden
  const { data: member, error } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .single();

  if (error || !member) {
    alert("Fehler beim Laden deiner Mitgliedsdaten.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userName").textContent = member.username;
  document.getElementById("userRole").textContent = member.role;

  // Zugriff prüfen
  if (member.status !== "active" && member.role !== "admin") {
    document.querySelector(".content").innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ Zugriff verweigert</h1>
        <p>Dein Konto ist noch nicht freigeschaltet.<br>
        Bitte warte auf Freischaltung durch einen Admin.</p>
      </main>`;
    return;
  }

  loadNews(member);
});

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

  list.innerHTML = data.length
    ? data
        .map(
          (n) => `
        <div class="news-item">
          <h3>${n.title}</h3>
          <p>${n.content}</p>
          <small>von ${n.author_name || "unbekannt"} – ${new Date(
            n.created_at
          ).toLocaleString()}</small>
        </div>`
        )
        .join("")
    : "<p>Keine Ankündigungen vorhanden.</p>";

  // Admin Formular
  if (member.role === "admin") {
    const form = document.getElementById("adminNewsForm");
    form.style.display = "block";

    document
      .getElementById("newsForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("title").value.trim();
        const content = document.getElementById("content").value.trim();
        if (!title || !content) return alert("Titel und Inhalt angeben.");

        const { error: insertError } = await supabase.from("news").insert({
          title,
          content,
          author_name: member.username,
        });

        if (insertError) alert("Fehler beim Erstellen der Ankündigung.");
        else {
          alert("✅ Ankündigung veröffentlicht.");
          e.target.reset();
          loadNews(member);
        }
      });
  }
}