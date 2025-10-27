import { supabase, getCurrentUser } from './supabase.js';

async function loadReservations() {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('reservations')
    .select('id, target_id, user_id, status, created_at');
  if (error) return console.error(error);

  const table = document.getElementById('reservationsTable');
  table.innerHTML = data.map(r => `
    <tr>
      <td>${r.target_id}</td>
      <td>${r.status}</td>
      <td>${new Date(r.created_at).toLocaleString()}</td>
    </tr>
  `).join('');
}
document.addEventListener('DOMContentLoaded', loadReservations);