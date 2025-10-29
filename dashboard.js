import { supabase, getCurrentUser, logout, enableAutoLogout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");
  const logoutBtn = document.getElementById("logoutBtn");
  const newsForm = document.getElementById("newsForm");
  const newsText = document.getElementById("newsText");
  const newsList = document.getElementById("newsList");
  const adminOnlyEls = document.querySelectorAll("[data-admin]");

  // Logout-Button
  logoutBtn?.addEventListener("click", () => logout());

  // Session prüfen
  const user = await getCurrentUser();
  if (!user) {
    console.warn("❌ Keine aktive Session – zurück zum Login.");
    location.href = "index.html";
    return;
  }

  // Member laden
  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, username, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (memberErr) {
    console.error("Fehler beim Laden der Mitgliedsdaten:", memberErr.message);
    return (location.href = "index.html");
  }

  if (!member) {
    console.warn("Kein Mitgliedseintrag gefunden.");
    return (location.href = "index.html");
  }

  if (member.status !== "active") {
    console.warn("⚓ Benutzer ist blockiert – zurück zum Loadingscreen.");
    return (location.href = "loadingscreen.html");
  }

  // Anzeige setzen
  userNameEl.textContent = member.username;
  userRoleEl.textContent = member.role;

  const isAdmin = member.role === "admin";
  adminOnlyEls.forEach(el => (el.style.display = isAdmin ? "" : "none"));
  if (isAdmin) newsForm.style.display = "";

  // --- News laden ---
  async function loadNews() {
    newsList.textContent = "Lade Ankündigungen...";

    const { data, error } = await supabase
      .from("news")
      .select("id, title, content, author_id, author_name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden der News:", error.message);
      newsList.textContent = "Fehler beim Laden der Ankündigungen.";
      return;
    }

    if (!data || data.length === 0) {
      newsList.textContent = "Keine Ankündigungen vorhanden.";
      return;
    }

    // Rendering
    newsList.innerHTML = data
      .map(n => {
        const d = new Date(n.created_at);
        const dateStr = d.toLocaleString("de-DE");
        const delBtn = isAdmin
          ? `<button class="btn" data-del="${n.id}" style="margin-left:auto;">Löschen</button>`
          : "";
        return `
          <article class="card" style="display:flex; flex-direction:column; gap:.4rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3 style="margin:0;">${escapeHTML(n.title || "Ankündigung")}</h3>
              ${delBtn}
            </div>
            <div class="muted" style="font-size:0.85rem;">
              von ${escapeHTML(n.author_name || "Unbekannt")} – ${dateStr}
            </div>
            <p style="white-space:pre-wrap; margin:0;">${escapeHTML(n.content || "")}</p>
          </article>
        `;
      })
      .join("");

    // Delete-Handler (nur Admin)
    if (isAdmin) {
      newsList.querySelectorAll("[data-del]").forEach(btn => {
        btn.addEventListener("click", async e => {
          const id = e.currentTarget.getAttribute("data-del");
          if (!confirm("Diesen Beitrag wirklich löschen?")) return;
          const { error: delErr } = await supabase.from("news").delete().eq("id", id);
          if (delErr) alert("Löschen fehlgeschlagen: " + delErr.message);
          else loadNews();
        });
      });
    }
  }

  // --- News posten ---
  newsForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const text = newsText.value.trim();
    if (!text) return;

    const lines = text.split("\n");
    const title = lines[0].length <= 80 ? lines[0] : "Ankündigung";
    const content = lines.slice(1).join("\n") || text;

    const { error: insErr } = await supabase.from("news").insert({
      title,
      content,
      author_id: user.id,
      author_name: member.username
    });

    if (insErr) {
      alert("Posten fehlgeschlagen: " + insErr.message);
      return;
    }

    newsText.value = "";
    loadNews();
  });

  // --- Initial ---
  loadNews();
  enableAutoLogout(30);
});

// Sicherheitsfunktion für HTML
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}