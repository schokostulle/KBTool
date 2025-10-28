import { supabase, logout, getCurrentUser } from './supabase.js';

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const user = await getCurrentUser();
  if (!user) {
    alert("Keine aktive Sitzung – bitte erneut anmelden.");
    window.location.href = "index.html";
    return;
  }

  // Benutzerinfo anzeigen (optional)
  const userInfo = document.getElementById("userInfo");
  if (userInfo) {
    userInfo.textContent = `Eingeloggt als ${user.email}`;
  }

  async function loadReports() {
  const { data, error } = await supabase
    .from('battle_reports')
    .select('attacker, defender, report_text, date')
    .order('date', { ascending: false });
  if (error) return console.error(error);

  const container = document.getElementById('reports');
  container.innerHTML = data.map(r => `
    <div class="report">
      <h3>${r.attacker} ⚔️ ${r.defender}</h3>
      <pre>${r.report_text}</pre>
      <small>${new Date(r.date).toLocaleString()}</small>
    </div>
  `).join('');
}
document.addEventListener('DOMContentLoaded', loadReports);
});

