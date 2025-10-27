// authguard.js
import { supabase, checkSession, logoutUser } from "./supabase.js";

/* ===============================================
   🔐 AuthGuard – Zugriffsschutz für Seiten
   =============================================== */

/**
 * checkAccess(roles)
 * Prüft, ob der eingeloggte User eine der erlaubten Rollen besitzt.
 * - roles: ['member'] oder ['admin'] oder ['member','admin']
 * Leitet automatisch weiter, falls nicht erlaubt.
 */
export async function checkAccess(roles = ["member", "admin"]) {
  const userRecord = await checkSession(roles);
  if (!userRecord) return;

  // Benutzerinformationen ins DOM einfügen, falls vorhanden
  const userEl = document.getElementById("user-info");
  if (userEl) {
    userEl.innerHTML = `
      <strong>${userRecord.username}</strong> 
      (${userRecord.role})
    `;
  }

  // Logout-Button verbinden
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logoutUser();
    });
  }

  console.log(`✅ Zugriff erlaubt für ${userRecord.username} (${userRecord.role})`);
  return userRecord;
}

/* ===============================================
   ⚙️ Automatische Initialisierung beim Laden
   =============================================== */

/**
 * Wenn du z. B. eine Seite nur für Admins schützen willst,
 * kannst du im <body>-Tag ein data-role-Attribut setzen:
 *   <body data-role="admin">
 * oder für alle Member:
 *   <body data-role="member">
 * oder weglassen (Standard = beide)
 */
window.addEventListener("DOMContentLoaded", async () => {
  const bodyRole = document.body.dataset.role;

  if (bodyRole === "admin") {
    await checkAccess(["admin"]);
  } else if (bodyRole === "member") {
    await checkAccess(["member"]);
  } else if (bodyRole === "shared") {
    await checkAccess(["member", "admin"]);
  } else {
    await checkAccess(["member", "admin"]);
  }
});