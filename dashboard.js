import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.user;

  // Benutzerinfos aus members holen
  const { data: currentUser, error } = await supabase
    .from("members")
    .select("id, username, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Fehler beim Laden des Benutzers:", error);
    return;
  }

  // Anzeige im Header
  document.getElementById("userName").textContent = currentUser.username;
  document.getElementById("userRole").textContent = currentUser.role;

  // ⚓ Admin-Links im Menü
  const adminLinks = document.querySelectorAll("[data-admin]");
  if (currentUser.role === "admin") {
    adminLinks.forEach((el) => (el.style.display = "block"));
  } else {
    adminLinks.forEach((el) => (el.style.display = "none"));
  }

  // ⚓ Geblockte Accounts -> zurück zum Login
  if (currentUser.status !== "active") {
    alert("⚓ Kein Zugriff – dein Konto ist noch nicht freigeschaltet.");
    await supabase.auth.signOut();
    window.location.href = "index.html";
    return;
  }

  // Dashboard anzeigen
  document.getElementById("contentArea").style.display = "block";

  // News laden (funktioniert wie bisher)
  await loadNews(currentUser);
});