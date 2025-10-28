import { supabase, getCurrentUser, logout } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loadingScreen = document.getElementById("loadingScreen");
  const pageContent = document.getElementById("pageContent");
  const logoutBtn = document.getElementById("logoutBtn");
  const tableArea = document.getElementById("memberTableArea");

  loadingScreen.style.display = "block";
  pageContent.style.display = "none";

  logoutBtn?.addEventListener("click", logout);

  // === Auth check ===
  const user = await getCurrentUser();
  if (!user) {
    alert("❌ No active session. Please log in again.");
    window.location.href = "index.html";
    return;
  }

  const { data: currentUser, error } = await supabase
    .from("members")
    .select("username, role, status")
    .eq("id", user.id)
    .single();

  if (error || !currentUser) {
    alert("Error loading your member data.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userName").textContent = currentUser.username;
  document.getElementById("userRole").textContent = currentUser.role;

  // Admin check
  if (currentUser.role !== "admin") {
    pageContent.innerHTML = `
      <main style="text-align:center; padding:3rem;">
        <h1>⚓ No Access</h1>
        <p>Only administrators can access this page.</p>
      </main>`;
    loadingScreen.style.display = "none";
    pageContent.style.display = "block";
    return;
  }

  loadingScreen.style.display = "none";
  pageContent.style.display = "block";

  // === Load all members ===
  await loadMembers(tableArea);
});

// ===========================================================
// ⚓ Load member list
// ===========================================================
async function loadMembers(container) {
  const { data, error } = await supabase
    .from("members")
    .select("id, username, role, status, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    container.innerHTML = `<p>❌ Error loading members.</p>`;
    console.error(error.message);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<p>No members found.</p>`;
    return;
  }

  // Render table
  const rows = data
    .map(
      (m) => `
        <tr>
          <td>${m.username}</td>
          <td>${m.role}</td>
          <td>${m.status}</td>
          <td>${new Date(m.created_at).toLocaleDateString()}</td>
        </tr>`
    )
    .join("");

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Role</th>
          <th>Status</th>
          <th>Registered</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}