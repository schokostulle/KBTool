import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Logout-Button aktivieren
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", logout);

  // Benutzer prüfen
  const user = await getCurrentUser();
  if (!user) {
    alert("❌ Keine aktive Sitzung. Bitte melde dich erneut an.");
    window.location.href = "index.html";
    return;
  }

  // Member-Infos laden
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
    document.querySelector("main").innerHTML = `
      <div class="text-center" style="margin-top:5rem;">
        <h2>⚓ Kein Zugriff</h2>
        <p>Dein Konto ist noch nicht freigeschaltet.<br>
        Bitte warte auf Freischaltung durch einen Admin.</p>
      </div>`;
    return;
  }

  // ===== Hier kannst du individuellen Seiteninhalt laden =====
  // Beispiel:
  // loadReservations();
});