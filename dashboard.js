import { supabase } from "./supabase.js";

const userNameEl = document.getElementById("userName");
const userRoleEl = document.getElementById("userRole");
const newsList = document.getElementById("newsList");
const newsForm = document.getElementById("newsForm");
const adminNews = document.getElementById("adminNews");
const logoutBtn = document.getElementById("logoutBtn");

// =======================================================
// ⚓ Dashboard laden
// =======================================================
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (window.location.href = "index.html");

  const user = session.user;

  // Hole Benutzerinformationen
  const { data: member, error } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !member) {
    console.error("Fehler beim Laden der Benutzerdaten:", error);
    return alert("Fehler beim Laden deiner Daten.");
  }

  if (member.status !== "active") {
    alert("⚓ Kein Zugriff – Dein Konto ist noch nicht freigeschaltet.");
    await supabase.auth.signOut();
    return (window.location.href = "index.html");
  }

  userNameEl.textContent = member.username || "Unbekannt";
  userRoleEl.textContent = member.role;

  // Admin sieht News-Formular
  if (member.role === "admin") {
    adminNews.classList.remove("hidden");
  }

  // Lade News
  await loadNews(member.role);
});

// =======================================================
// 📜 News laden
// =======================================================
async function loadNews(role) {
  const { data: news, error } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der News:", error);
    newsList.innerHTML = "<p>Fehler beim Laden der Ankündigungen.</p>";
    return;
  }

  if (!news || news.length === 0) {
    newsList.innerHTML = "<p>Keine Ankündigungen vorhanden.</p>";
    return;
  }

  newsList.innerHTML = news
  .map(
    (item) => `
      <div class="news-wrapper">
        <article class="card">
          <h3>${item.title}</h3>
          <p>${item.content}</p>
          <small>Veröffentlicht am ${new Date(item.created_at).toLocaleString("de-DE")}</small>
        </article>
        ${
          role === "admin"
            ? `<button class="btn-delete" data-id="${item.id}" title="Löschen">🗑️</button>`
            : ""
        }
      </div>`
  )
  .join("");

  // Admin kann löschen
  if (role === "admin") {
    document.querySelectorAll(".btn-delete").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Diese Ankündigung wirklich löschen?")) return;

        const { error } = await supabase.from("news").delete().eq("id", id);
        if (error) alert("Fehler beim Löschen der Ankündigung.");
        else await loadNews(role);
      })
    );
  }
}

// =======================================================
// 🧭 Neue News posten (Admin)
// =======================================================
newsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("newsTitle").value.trim();
  const content = document.getElementById("newsText").value.trim();

  if (!title || !content) return alert("Bitte Titel und Nachricht ausfüllen.");

  const { data: { session } } = await supabase.auth.getSession();
  const user = session.user;

  const { error } = await supabase.from("news").insert({
    title,
    content,
    author_id: user.id,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Fehler beim Posten:", error);
    return alert("Fehler beim Veröffentlichen der Nachricht.");
  }

  document.getElementById("newsTitle").value = "";
  document.getElementById("newsText").value = "";

  await loadNews("admin");
});

// =======================================================
// ⚓ Logout
// =======================================================
logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});