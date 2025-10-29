console.log("🚀 dashboard.js gestartet");

import { supabase, getCurrentUser, logout, enableAutoLogout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");
  const logoutBtn = document.getElementById("logoutBtn");
  const newsForm = document.getElementById("newsForm");
  const newsText = document.getElementById("newsText");
  const newsList = document.getElementById("newsList");
  const adminOnlyEls = document.querySelectorAll("[data-admin]");

  logoutBtn?.addEventListener("click", () => logout());

  // ---- Session prüfen ----
  const user = await getCurrentUser();
  if (!user) {
    return (location.href = "index.html");
  }

  // Memberdaten laden
  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, username, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (memberErr || !member) {
    console.warn("Member lookup failed:", memberErr?.message);
    return (location.href = "index.html");
  }

  if (member.status !== "active") {
    return (location.href = "loadingscreen.html");
  }

  userNameEl.textContent = member.username;
  userRoleEl.textContent = member.role;

  const isAdmin = member.role === "admin";
  adminOnlyEls.forEach(el => el.style.display = isAdmin ? "" : "none");
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

  // ---- News posten ----
  newsForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const text = newsText.value.trim();
    if (!text) return;

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

  // ---- Initialer Ladevorgang ----
  loadNews();

  // ---- Auto-Logout aktivieren ----
  enableAutoLogout(30);
});

// HTML-escaping helper
function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

console.log("🏁 dashboard.js vollständig geladen");