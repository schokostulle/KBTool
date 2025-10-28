// ⬅️ Neu: enableAutoLogout mit importieren
import { supabase, getCurrentUser, logout, enableAutoLogout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  // ---- Auth & UI-Refs ----
  const loadingScreen = document.getElementById("loadingScreen");
  const dashboardContent = document.getElementById("dashboardContent");
  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");
  const logoutBtn = document.getElementById("logoutBtn");

  // Admin-only Elemente
  const adminOnlyEls = Array.from(document.querySelectorAll("[data-admin]"));
  const newsForm = document.getElementById("newsForm");       // textarea + submit
  const newsText = document.getElementById("newsText");       // textarea
  const newsList = document.getElementById("newsList");       // container

  logoutBtn?.addEventListener("click", () => logout());

  // ---- Guard & User laden ----
  const user = await getCurrentUser();
  if (!user) {
    // Keine Session → zurück
    return (location.href = "index.html");
  }

  // Memberdaten
  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, username, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (memberErr || !member) {
    console.warn("Member lookup failed:", memberErr?.message);
    return (location.href = "index.html");
  }

  // Blocked? → zur Lade-/Hinweis-Seite
  if (member.status !== "active") {
    return (location.href = "loadingscreen.html");
  }

  // UI befüllen
  userNameEl.textContent = member.username;
  userRoleEl.textContent = member.role;

  // Admin-Controls ein-/ausblenden
  const isAdmin = member.role === "admin";
  adminOnlyEls.forEach(el => {
    el.style.display = isAdmin ? "" : "none";
  });
  if (newsForm) newsForm.style.display = isAdmin ? "" : "none";

  // ---- News laden ----
  async function loadNews() {
    if (!newsList) return;
    newsList.textContent = "Lade Ankündigungen…";

    const { data, error } = await supabase
      .from("news")
      .select("id, title, content, author_id, author_name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden der Ankündigungen:", error.message);
      newsList.textContent = "Fehler beim Laden der Ankündigungen.";
      return;
    }

    if (!data || data.length === 0) {
      newsList.textContent = "Keine Ankündigungen vorhanden.";
      return;
    }

    // Render
    newsList.innerHTML = data.map(n => {
      const d = new Date(n.created_at);
      const dateStr = d.toLocaleString("de-DE");
      const delBtn = isAdmin
        ? `<button class="btn" data-del="${n.id}" style="margin-left:auto;">Löschen</button>`
        : "";
      return `
        <article class="card" style="display:flex; gap:.6rem; align-items:flex-start;">
          <div style="flex:1 1 auto;">
            <h3 style="margin:0 0 .25rem 0;">${escapeHTML(n.title || "Ankündigung")}</h3>
            <div class="muted" style="margin-bottom:.25rem;">
              von ${escapeHTML(n.author_name || "Unbekannt")} – ${dateStr}
            </div>
            <p style="white-space:pre-wrap; margin:0;">${escapeHTML(n.content || "")}</p>
          </div>
          ${delBtn}
        </article>
      `;
    }).join("");

    // Delete-Handler nur für Admin
    if (isAdmin) {
      newsList.querySelectorAll("[data-del]").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.currentTarget.getAttribute("data-del");
          if (!confirm("Diesen Post wirklich löschen?")) return;
          const { error: delErr } = await supabase.from("news").delete().eq("id", id);
          if (delErr) {
            alert("Löschen fehlgeschlagen: " + delErr.message);
          } else {
            loadNews();
          }
        });
      });
    }
  }

  // ---- News posten (nur Admin) ----
  newsForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = newsText.value.trim();
    if (!text) return;

    // Wir erlauben optional erste Zeile als Titel (Markdown-Style), sonst fester Titel
    const lines = text.split("\n");
    const maybeTitle = lines[0].length <= 80 ? lines[0] : "Ankündigung";
    const body = lines.slice(1).join("\n") || text;

    const { error: insErr } = await supabase.from("news").insert({
      title: maybeTitle,
      content: body,
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

  // ---- Sicht umschalten: Loading weg, Content sichtbar ----
  if (loadingScreen) loadingScreen.style.display = "none";
  if (dashboardContent) dashboardContent.style.display = "";

  // Initiale Daten
  loadNews();

  // ⏰ ⬅️ Neu: Auto-Logout nach 30 Minuten Inaktivität
  enableAutoLogout(30);
});

// kleine Helper für sicheres Rendering
function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}