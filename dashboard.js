import { supabase, getCurrentUser } from './supabase.js';

document.addEventListener("DOMContentLoaded", async () => {
  const loading = document.getElementById("loadingScreen");
  const content = document.getElementById("dashboardContent");

  // 1️⃣ User-Session prüfen
  const user = await getCurrentUser();
  if (!user) {
    alert("❌ Keine aktive Sitzung. Bitte melde dich erneut an.");
    window.location.href = "index.html";
    return;
  }

  // 2️⃣ Member-Eintrag abrufen
  const { data: member, error } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .single();

  if (error || !member) {
    alert("Fehler beim Laden deines Profils.");
    window.location.href = "index.html";
    return;
  }

  // 3️⃣ Zugriff prüfen
  if (member.status !== "active" && member.role !== "admin") {
    loading.innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ Zugriff verweigert</h1>
        <p>Dein Konto ist noch nicht freigeschaltet.<br>
        Bitte warte auf die Bestätigung durch einen Admin.</p>
        <button onclick="window.location.href='index.html'">Zurück zum Login</button>
      </main>
    `;
    return;
  }

  // 4️⃣ Zugriff erlaubt → Dashboard anzeigen
  loading.style.display = "none";
  content.style.display = "block";

  document.getElementById("userName").textContent = member.username;
  document.getElementById("userRole").textContent = member.role;

  await loadNews(member);
});

async function loadNews(member) {
  const { data, error } = await supabase
    .from("news")
    .select("id, title, content, author_name, created_at")
    .order("created_at", { ascending: false });

  if (error) return (document.getElementById("newsList").textContent = "Fehler beim Laden der Ankündigungen.");

  document.getElementById("newsList").innerHTML = data.length
    ? data.map(n => `
      <div class="news-item">
        <h3>${n.title}</h3>
        <p>${n.content}</p>
        <small>von ${n.author_name || "unbekannt"} – ${new Date(n.created_at).toLocaleString()}</small>
      </div>
    `).join("")
    : "<p>Keine Ankündigungen vorhanden.</p>";

  if (member.role === "admin") {
    document.getElementById("adminNewsForm").style.display = "block";
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

      if (insertError) alert("Fehler beim Erstellen der Ankündigung.");
      else {
        alert("✅ Ankündigung veröffentlicht.");
        await loadNews(member);
        newsForm.reset();
      }
    });
  }
}