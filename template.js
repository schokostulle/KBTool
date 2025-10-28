import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loadingScreen = document.getElementById("loadingScreen");
  const pageContent = document.getElementById("pageContent");
  const logoutBtn = document.getElementById("logoutBtn");

  loadingScreen.style.display = "block";
  pageContent.style.display = "none";

  logoutBtn?.addEventListener("click", logout);

  const user = await getCurrentUser();
  if (!user) {
    alert("❌ Keine aktive Sitzung. Bitte melde dich erneut an.");
    window.location.href = "index.html";
    return;
  }

  const { data: member, error } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .single();

  if (error || !member) {
    alert("Fehler beim Laden der Mitgliedsdaten.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userName").textContent = member.username;
  document.getElementById("userRole").textContent = member.role;

  // Admin-Links ausblenden
  if (member.role !== "admin") {
    document
      .querySelectorAll("[data-admin]")
      .forEach((link) => (link.style.display = "none"));
  }

  // Zugriff prüfen
  if (member.status !== "active" && member.role !== "admin") {
    pageContent.innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ Kein Zugriff</h1>
        <p>Dein Konto ist noch nicht freigeschaltet.<br>
        Bitte warte auf Freischaltung durch einen Admin.</p>
      </main>`;
    loadingScreen.style.display = "none";
    pageContent.style.display = "block";
    return;
  }

  // Seite darf angezeigt werden
  loadingScreen.style.display = "none";
  pageContent.style.display = "block";

  // Hier kannst du seitenabhängig Funktionen laden
  console.log("✅ Seite geladen:", document.title, "für Benutzer:", member.username);
});