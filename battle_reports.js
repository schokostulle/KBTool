import { supabase } from './supabase.js';

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