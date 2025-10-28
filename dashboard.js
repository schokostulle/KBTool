// dashboard.js
import { supabase, getCurrentUser } from './supabase.js';

console.log("✅ dashboard.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  // Schritt 1: prüfen, ob User angemeldet ist
  const user = await getCurrentUser();
  if (!user) {
    alert("❌ Keine aktive Sitzung. Bitte melde dich erneut an.");
    window.location.href = "index.html";
    return;
  }

  console.log("👤 Eingeloggt als:", user.email);

  // Schritt 2: Member-Daten abrufen
  const { data: member, error } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("❌ Fehler beim Abruf der Mitgliedsdaten:", error.message);
    alert("Fehler beim Laden deines Profils.");
    window.location.href = "index.html";
    return;
  }

  console.log("🧭 Mitgliedsdaten:", member);

  // Schritt 3: Zugriffsprüfung
  if (member.status !== "active" && member.role !== "admin") {
    document.body.innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ Zugriff verweigert</h1>
        <p>Dein Konto ist noch nicht freigeschaltet.<br>
        Bitte warte auf die Bestätigung durch einen Admin.</p>
        <button onclick="window.location.href='index.html'">Zurück zum Login</button>
      </main>
    `;
    return;
  }

  // Schritt 4: Dashboard laden (wenn aktiv)
  document.getElementById("userName").textContent = member.username;
  document.getElementById("userRole").textContent = member.role;

  // News laden
  await loadNews(member);
});


// ===========================================================
// ⚓ News laden (sichtbar für alle, aber schreiben nur Admins)
// ===========================================================
async function loadNews(member) {
  const { data, error } = await supabase
    .from("news")
    .select("id, title, content, author_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Fehler beim Laden der News:", error.message);
    document.getElementById("newsList").textContent = "Fehler beim Laden der Ankündigungen.";
    return;
  }

  const list = document.getElementById("newsList");
  list.innerHTML = data.length
    ? data.map(n => `
        <div class="news-item">
          <h3>${n.title}</h3>
          <p>${n.content}</p>
          <small>von ${n.author_name || "unbekannt"} – ${new Date(n.created_at).toLocaleString()}</small>
        </div>
      `).join("")
    : "<p>Keine Ankündigungen vorhanden.</p>";

  // Admins dürfen neue Ankündigungen schreiben
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

      if (insertError) {
        console.error("❌ Fehler beim Posten:", insertError.message);
        alert("Fehler beim Erstellen der Ankündigung.");
      } else {
        alert("✅ Ankündigung veröffentlicht.");
        await loadNews(member);
        newsForm.reset();
      }
    });
  }
}