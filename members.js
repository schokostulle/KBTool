import { supabase } from './supabase.js';

async function loadMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('username, role, status, created_at');
  if (error) return console.error(error);

  const table = document.getElementById('membersTable');
  table.innerHTML = data.map(m => `
    <tr>
      <td>${m.username}</td>
      <td>${m.role}</td>
      <td>${m.status}</td>
      <td>${new Date(m.created_at).toLocaleString()}</td>
    </tr>
  `).join('');
}
document.addEventListener('DOMContentLoaded', loadMembers);